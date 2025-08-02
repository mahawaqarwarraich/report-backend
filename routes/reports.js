const express = require('express');
const PDFDocument = require('pdfkit');
const auth = require('../middleware/auth');
const Report = require('../models/Report');
const User = require('../models/User');

const router = express.Router();

// Get or create report for current month
router.get('/current', auth, async (req, res) => {
  try {
    const currentDate = new Date();
    const month = currentDate.toLocaleString('en-US', { month: 'long' });
    const year = currentDate.getFullYear().toString();

    let report = await Report.findOne({
      user: req.user._id,
      month,
      year
    });

    if (!report) {
      // Create new report with all days initialized
      const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
      const days = [];
      
      for (let i = 1; i <= daysInMonth; i++) {
        days.push({
          date: i,
          month: month,
          year: year,
          namaz: 'no',
          hifz: 'no',
          nazra: 'no',
          tafseer: 'no',
          hadees: 'no',
          literature: 'no',
          darsiKutab: 'no',
          karkunaanMulakaat: 0,
          amoomiAfraadMulakaat: 0,
          khatootTadaad: 0,
          ghrKaKaam: 'no'
        });
      }

      report = new Report({
        user: req.user._id,
        month,
        year,
        days
      });

      await report.save();

      // Add report to user's reports array
      await User.findByIdAndUpdate(req.user._id, {
        $push: { reports: report._id }
      });
    } else {
      // Migrate existing days to include month and year if missing
      let needsUpdate = false;
      report.days = report.days.map(day => {
        if (!day.month || !day.year) {
          needsUpdate = true;
          return {
            ...day,
            month: month,
            year: year
          };
        }
        return day;
      });

      if (needsUpdate) {
        await report.save();
        console.log(`Migrated existing report for ${month} ${year} to include month and year fields`);
      }
    }

    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all reports for a user
router.get('/all', auth, async (req, res) => {
  try {
    const reports = await Report.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select('-__v');
    
    res.json(reports);
  } catch (error) {
    console.error('Error fetching user reports:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get report by month and year
router.get('/:month/:year', auth, async (req, res) => {
  try {
    const { month, year } = req.params;
    
    const report = await Report.findOne({
      user: req.user._id,
      month,
      year
    });

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update daily activities
router.put('/daily/:date', auth, async (req, res) => {
  try {
    const { date } = req.params;
    const updateData = req.body;

    const currentDate = new Date();
    const month = currentDate.toLocaleString('en-US', { month: 'long' });
    const year = currentDate.getFullYear().toString();

    let report = await Report.findOne({
      user: req.user._id,
      month,
      year
    });

    // If report doesn't exist, create it
    if (!report) {
      // Create new report with all days initialized
      const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
      const days = [];
      
      for (let i = 1; i <= daysInMonth; i++) {
        days.push({
          date: i,
          month: month,
          year: year,
          namaz: 'no',
          hifz: 'no',
          nazra: 'no',
          tafseer: 'no',
          hadees: 'no',
          literature: 'no',
          darsiKutab: 'no',
          karkunaanMulakaat: 0,
          amoomiAfraadMulakaat: 0,
          khatootTadaad: 0,
          ghrKaKaam: 'no'
        });
      }

      report = new Report({
        user: req.user._id,
        month,
        year,
        days
      });

      await report.save();

      // Add report to user's reports array
      await User.findByIdAndUpdate(req.user._id, {
        $push: { reports: report._id }
      });

      console.log(`Created new report for ${month} ${year} and added to user's reports list`);
    } else {
      // Migrate existing days to include month and year if missing
      let needsUpdate = false;
      report.days = report.days.map(day => {
        if (!day.month || !day.year) {
          needsUpdate = true;
          return {
            ...day,
            month: month,
            year: year
          };
        }
        return day;
      });

      if (needsUpdate) {
        await report.save();
        console.log(`Migrated existing report for ${month} ${year} to include month and year fields`);
      }
    }

    // Find and update the specific day
    const dayIndex = report.days.findIndex(day => day.date === parseInt(date));
    if (dayIndex === -1) {
      return res.status(404).json({ message: 'Day not found' });
    }

    // Update the day data
    Object.keys(updateData).forEach(key => {
      if (report.days[dayIndex].hasOwnProperty(key)) {
        report.days[dayIndex][key] = updateData[key];
      }
    });

    await report.save();
    console.log(`Updated daily report for date ${date} in ${month} ${year}`);
    res.json(report);
  } catch (error) {
    console.error('Error updating daily report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add Q&A answers to report
router.post('/add-answers', auth, async (req, res) => {
  try {
    const { month, year, answers } = req.body;

    console.log('Adding Q&A answers:', { month, year, answers });

    // Validate required fields
    if (!month || !year || !answers) {
      return res.status(400).json({ 
        success: false,
        message: 'Month, year, and answers are required' 
      });
    }

    // Find report for current user and matching month AND year
    let report = await Report.findOne({
      user: req.user._id,
      month: month,
      year: year
    });

    // If report doesn't exist, create it
    if (!report) {
      console.log(`Creating new report for ${month} ${year}`);
      
      report = new Report({
        user: req.user._id,
        month: month,
        year: year,
        days: [],
        qa: {}
      });

      await report.save();

      // Add report to user's reports array
      await User.findByIdAndUpdate(req.user._id, {
        $push: { reports: report._id }
      });

      console.log(`Created new report and added to user's reports list`);
    }

    // Initialize qa object if it doesn't exist
    if (!report.qa) {
      report.qa = {};
    }

    // Create a clean qa object with only valid question fields
    const cleanQa = {};
    Object.keys(answers).forEach(key => {
      if (key.match(/^q[1-9]$|^q1[0-9]$|^q2[0-8]$/) && 
          answers[key] && 
          typeof answers[key] === 'string' && 
          answers[key].trim()) {
        cleanQa[key] = answers[key].trim();
        console.log(`Updated ${key}: ${answers[key].trim()}`);
      }
    });
    
    // Replace the entire qa object to remove any existing _id
    report.qa = cleanQa;
    await report.save();
    console.log(`Successfully saved Q&A answers for ${month} ${year}`);

    res.json({
      success: true,
      message: 'Q&A responses saved successfully',
      report: report
    });

  } catch (error) {
    console.error('Error saving Q&A answers:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error saving Q&A responses. Please try again.' 
    });
  }
});

// Update Q&A section
router.put('/qa', auth, async (req, res) => {
  try {
    const { qa } = req.body;

    const currentDate = new Date();
    const month = currentDate.toLocaleString('en-US', { month: 'long' });
    const year = currentDate.getFullYear().toString();

    let report = await Report.findOne({
      user: req.user._id,
      month,
      year
    });

    // If report doesn't exist, create it
    if (!report) {
      // Create new report with all days initialized
      const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
      const days = [];
      
      for (let i = 1; i <= daysInMonth; i++) {
        days.push({
          date: i,
          namaz: 'no',
          hifz: 'no',
          nazra: 'no',
          tafseer: 'no',
          hadees: 'no',
          literature: 'no',
          darsiKutab: 'no',
          karkunaanMulakaat: 0,
          amoomiAfraadMulakaat: 0,
          khatootTadaad: 0,
          ghrKaKaam: 'no'
        });
      }

      report = new Report({
        user: req.user._id,
        month,
        year,
        days
      });

      await report.save();

      // Add report to user's reports array
      await User.findByIdAndUpdate(req.user._id, {
        $push: { reports: report._id }
      });

      console.log(`Created new report for ${month} ${year} and added to user's reports list`);
    } else {
      // Migrate existing days to include month and year if missing
      let needsUpdate = false;
      report.days = report.days.map(day => {
        if (!day.month || !day.year) {
          needsUpdate = true;
          return {
            ...day,
            month: month,
            year: year
          };
        }
        return day;
      });

      if (needsUpdate) {
        await report.save();
        console.log(`Migrated existing report for ${month} ${year} to include month and year fields`);
      }
    }

    // Create a clean qa object with only valid question fields (q1 through q28)
    const cleanQa = {};
    Object.keys(qa).forEach(key => {
      if (key.match(/^q[1-9]$|^q1[0-9]$|^q2[0-8]$/)) { // Only q1 to q28
        cleanQa[key] = qa[key];
      }
    });
    
    // Replace the entire qa object to remove any existing _id
    report.qa = cleanQa;
    await report.save();

    console.log(`Updated Q&A for ${month} ${year}`);
    res.json(report);
  } catch (error) {
    console.error('Error updating Q&A:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Complete report
router.put('/complete', auth, async (req, res) => {
  try {
    const { month, year } = req.body;

    const report = await Report.findOne({
      user: req.user._id,
      month,
      year
    });

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    report.isCompleted = true;
    report.completedAt = new Date();
    await report.save();

    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Test PDF generation
router.get('/test-pdf', auth, async (req, res) => {
  try {
    console.log('Testing PDF generation...');
    
    // Create a simple test PDF
    const doc = new PDFDocument();
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=test-report.pdf');
    
    doc.pipe(res);

    // Add simple content
    doc.fontSize(20).text('Test PDF Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text('This is a test PDF to verify PDF generation is working.');
    doc.moveDown();
    doc.text(`Generated for user: ${req.user.name}`);
    doc.moveDown();
    doc.text(`Generated at: ${new Date().toLocaleString()}`);

    console.log('Test PDF generation completed');
    doc.end();
  } catch (error) {
    console.error('Error generating test PDF:', error);
    res.status(500).json({ message: 'Error generating test PDF' });
  }
});

// Generate and download PDF
router.get('/pdf/:month/:year', auth, async (req, res) => {
  try {
    const { month, year } = req.params;
    
    console.log(`Generating PDF for ${month} ${year} for user ${req.user._id}`);

    const report = await Report.findOne({
      user: req.user._id,
      month,
      year
    }).populate('user');

    if (!report) {
      console.log(`Report not found for ${month} ${year}`);
      return res.status(404).json({ message: 'Report not found' });
    }

    console.log(`Found report with ${report.days.length} days`);
    console.log('Sample day data:', report.days[0]);

    // Create PDF
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=islamic-report-${month}-${year}-${Date.now()}.pdf`);
    
    // Handle PDF stream errors
    doc.on('error', (error) => {
      console.error('PDF stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error generating PDF stream' });
      }
    });

    doc.pipe(res);

    try {
      // Header
      doc.fontSize(24).font('Helvetica-Bold').text('Islamic Report', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(18).font('Helvetica').text(`${month} ${year}`, { align: 'center' });
      doc.moveDown(2);

      // User Information Section
      doc.fontSize(14).font('Helvetica-Bold').text('User Information', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica');
      doc.text(`Name: ${report.user.name || 'N/A'}`);
      doc.text(`Class: ${report.user.class || 'N/A'}`);
      doc.text(`Institution: ${report.user.educationalInstitution || 'N/A'}`);
      doc.text(`Address: ${report.user.address || 'N/A'}`);
      doc.text(`Phone: ${report.user.phoneNumber || 'N/A'}`);
      doc.moveDown(2);

      // Daily Activities Table
      doc.fontSize(14).font('Helvetica-Bold').text('Daily Activities Report', { underline: true });
      doc.moveDown(1);

      // Table headers
      const headers = ['Date', 'Namaz', 'Hifz', 'Nazra', 'Tafseer', 'Hadees', 'Literature', 'Books', 'Workers', 'General', 'Letters', 'Housework'];
      const columnWidth = 40;
      const startX = 50;
      let currentY = doc.y;

      // Draw header row
      doc.fontSize(8).font('Helvetica-Bold');
      headers.forEach((header, index) => {
        const x = startX + (index * columnWidth);
        doc.text(header, x, currentY);
      });

      currentY += 20;
      doc.moveDown(0.5);

      // Draw data rows
      doc.fontSize(8).font('Helvetica');
      report.days.forEach(day => {
        // Check if we need a new page
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }

        console.log(`Processing day ${day.date}:`, {
          namaz: day.namaz,
          hifz: day.hifz,
          nazra: day.nazra,
          tafseer: day.tafseer,
          hadees: day.hadees,
          literature: day.literature,
          darsiKutab: day.darsiKutab,
          karkunaanMulakaat: day.karkunaanMulakaat,
          amoomiAfraadMulakaat: day.amoomiAfraadMulakaat,
          khatootTadaad: day.khatootTadaad,
          ghrKaKaam: day.ghrKaKaam
        });

        // Create row data for this specific day
        const row = [
          day.date.toString(),                    // Column 1: Date (1, 2, 3...)
          day.namaz === 'yes' ? 'Y' : 'N',       // Column 2: Namaz (Y/N)
          day.hifz === 'yes' ? 'Y' : 'N',        // Column 3: Hifz (Y/N)
          day.nazra === 'yes' ? 'Y' : 'N',       // Column 4: Nazra (Y/N)
          day.tafseer === 'yes' ? 'Y' : 'N',     // Column 5: Tafseer (Y/N)
          day.hadees === 'yes' ? 'Y' : 'N',      // Column 6: Hadees (Y/N)
          day.literature === 'yes' ? 'Y' : 'N',  // Column 7: Literature (Y/N)
          day.darsiKutab === 'yes' ? 'Y' : 'N',  // Column 8: Books (Y/N)
          (day.karkunaanMulakaat || 0).toString(), // Column 9: Workers (number)
          (day.amoomiAfraadMulakaat || 0).toString(), // Column 10: General (number)
          (day.khatootTadaad || 0).toString(),   // Column 11: Letters (number)
          day.ghrKaKaam === 'yes' ? 'Y' : 'N'    // Column 12: Housework (Y/N)
        ];

        // Draw each cell in the row
        row.forEach((cell, index) => {
          const x = startX + (index * columnWidth);
          doc.text(cell, x, currentY);
        });

        currentY += 15;
      });

      doc.moveDown(2);

      // Q&A Section - Display below the table with full page width
      console.log('Q&A data:', report.qa);
      if (report.qa && typeof report.qa === 'object') {
        const qaEntries = Object.entries(report.qa);
        
        // Force new line and reset positioning
        doc.moveDown(2);
        
        // Section header with full width - properly centered
        doc.fontSize(16).font('Helvetica-Bold');
        doc.text('Monthly Questions & Answers', 0, doc.y, { align: 'center', width: 600 });
        doc.moveDown(1);
        
        // Add a line separator
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(1);

        const questions = [
          'Agr koi namaz qaza hui to kis waqt ki aur kyun?',
          'Mutaleya tafseer-o-hadees sy liye gaye eham asool aur us pr amal daramad ki surat-e-haal?',
          'Mutaleya shuda(surat, kitaab, hadees, literature) ka naam?(mukamal/jari)',
          'Hifz shuda surat, hadees, dua?',
          'Konsi ikhlaaqi khoobi apnaaney ya burai chorny ki koshish rhi?',
          'Khandaan, hamsaya, degar mutalakeen k saath husn mamla, khidmat, ayadat, tauhfa waghera ki kya koshishein rhin?',
          'Tadaad mutaiyan afraad?',
          'Izafa mutaiyan afraad?',
          'Kitny mutaiyan afraad sy raabta rha?',
          'Mutaiyan afraad k saath ki gai sirgarmiyaan?',
          'Kya apka halka dars qaim hai?',
          'Dawati halky main ki gai sirgarmiyaan?(sisilawar dars quran/qurani class/degar)',
          'Kitny hami banaye?',
          'Kitny afraad ko islam ki bunyadi baatein sikhai?',
          'Ijtemai mutaly(tadaad)?',
          'Group discusssions(tadaad)?',
          'Hadiya kutab(tadaad)?',
          'Library sy parhwain(tadaad)?',
          'Kya mtutalka ijtemaat main shirkat ki?',
          'Shirkat na krny ki wajah?',
          'Apni anat di?',
          'Doosron sy kitni jama ki?',
          'Kya nisaab main milny waaly kaam kiye?',
          'Zer-e-tarbiyat afraad k liye kya koshishein rhi?',
          'Degar koi baat/kaam/masla/mashwara/muhsiba?',
          'Kya report barwaqt arsaal kr rhi hein?',
          'Agr berwaqt arsaal nahi kr rhi to wajah?',
          'Arsaal krdah khatoot nazma shehr/rafiqaat/karkunaan?'
        ];

        console.log('PDF Questions array length:', questions.length);
        console.log('First question:', questions[0]);
        console.log('Last question:', questions[questions.length - 1]);

        // Show all 28 questions regardless of whether they have answers
        for (let index = 0; index < 28; index++) {
          const questionText = questions[index];
          const key = `q${index + 1}`;
          const answer = report.qa[key] || '';
          
          // Question (bold) - start from left margin
          doc.fontSize(12).font('Helvetica-Bold');
          doc.text(`Q${index + 1}: ${questionText}`, 50, doc.y);
          doc.moveDown(0.5);
          
          // Answer (normal text) - start from left margin with full width
          const answerText = (answer && typeof answer === 'string' && answer.trim()) ? answer : 'No answer provided';
          doc.fontSize(11).font('Helvetica');
          doc.text(`A: ${answerText}`, 50, doc.y, {
            width: 500,
            align: 'left'
          });
          doc.moveDown(1.5);
          
          // Check if we need a new page
          if (doc.y > 700) {
            doc.addPage();
          }
        }
      } else {
        console.log('No Q&A data found in report');
      }

      // Footer
      doc.fontSize(10).font('Helvetica').text(`Report generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });

      console.log('PDF generation completed successfully');
      doc.end();
    } catch (pdfError) {
      console.error('Error during PDF content generation:', pdfError);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error generating PDF content' });
      }
    }

  } catch (error) {
    console.error('Error generating PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error generating PDF. Please try again.' });
    }
  }
});

// Add day to report
router.post('/add-day', auth, async (req, res) => {
  try {
    const { date, month, year, namaz, hifz, nazra, tafseer, hadees, literature, darsiKutab, karkunaanMulakaat, amoomiAfraadMulakaat, khatootTadaad, ghrKaKaam } = req.body;

    console.log('Adding day to report:', { date, month, year, namaz, hifz, nazra, tafseer, hadees, literature, darsiKutab, karkunaanMulakaat, amoomiAfraadMulakaat, khatootTadaad, ghrKaKaam });

    // Create day object
    const dayObject = {
      date: parseInt(date),
      month: month,
      year: year,
      namaz: namaz || 'no',
      hifz: hifz || 'no',
      nazra: nazra || 'no',
      tafseer: tafseer || 'no',
      hadees: hadees || 'no',
      literature: literature || 'no',
      darsiKutab: darsiKutab || 'no',
      karkunaanMulakaat: parseInt(karkunaanMulakaat) || 0,
      amoomiAfraadMulakaat: parseInt(amoomiAfraadMulakaat) || 0,
      khatootTadaad: parseInt(khatootTadaad) || 0,
      ghrKaKaam: ghrKaKaam || 'no'
    };

    // Find report for current user and matching month AND year
    let report = await Report.findOne({
      user: req.user._id,
      month: month,
      year: year
    });

    // If report doesn't exist, create it
    if (!report) {
      console.log(`Creating new report for ${month} ${year}`);
      
      report = new Report({
        user: req.user._id,
        month: month,
        year: year,
        days: []
      });

      await report.save();

      // Add report to user's reports array
      await User.findByIdAndUpdate(req.user._id, {
        $push: { reports: report._id }
      });

      console.log(`Created new report and added to user's reports list`);
    }

    // Check if day already exists
    const existingDayIndex = report.days.findIndex(day => day.date === parseInt(date) && day.month === month && day.year === year);
    
    if (existingDayIndex !== -1) {
      // Update existing day
      console.log(`Updating existing day ${date} in ${month} ${year}`);
      report.days[existingDayIndex] = dayObject;
    } else {
      // Add new day
      console.log(`Adding new day ${date} to ${month} ${year}`);
      report.days.push(dayObject);
    }

    await report.save();
    console.log(`Successfully saved day ${date} to report for ${month} ${year}`);

    res.json({
      success: true,
      message: `Day ${date} saved successfully to ${month} ${year} report`,
      report: report
    });

  } catch (error) {
    console.error('Error adding day to report:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error saving day to report. Please try again.' 
    });
  }
});

// Get all reports for user
router.get('/', auth, async (req, res) => {
  try {
    const reports = await Report.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    
    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 