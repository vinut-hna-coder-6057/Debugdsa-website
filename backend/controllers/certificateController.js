import PDFDocument from "pdfkit";

import User from "../models/User.js";

//////////////////////////////////////////////////
// DOWNLOAD CERTIFICATE
//////////////////////////////////////////////////

export const downloadCertificate = async (req, res) => {
  try {

    //////////////////////////////////////////////////
    // FIND USER
    //////////////////////////////////////////////////

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    //////////////////////////////////////////////////
    // MINIMUM ELIGIBILITY
    //////////////////////////////////////////////////

    if (user.points < 100) {
      return res.status(403).json({
        message:
          "You need at least 100 points to download certificate"
      });
    }

    //////////////////////////////////////////////////
    // CERTIFICATE LEVEL
    //////////////////////////////////////////////////

    let level = "Bronze";

    if (user.points >= 500) {
      level = "Gold";
    } else if (user.points >= 250) {
      level = "Silver";
    }

    //////////////////////////////////////////////////
    // CERTIFICATE ID
    //////////////////////////////////////////////////

    const certificateId = `DDSA-${Date.now()}`;

    //////////////////////////////////////////////////
    // PDF CONFIG
    //////////////////////////////////////////////////

    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 0
    });

    //////////////////////////////////////////////////
    // RESPONSE HEADERS
    //////////////////////////////////////////////////

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=DebugDSA-Certificate-${user._id}.pdf`
    );

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    doc.pipe(res);

    //////////////////////////////////////////////////
    // PAGE SIZE
    //////////////////////////////////////////////////

    const width = doc.page.width;
    const height = doc.page.height;

    //////////////////////////////////////////////////
    // BACKGROUND
    //////////////////////////////////////////////////

    doc.rect(0, 0, width, height)
      .fill("#ffffff");

    //////////////////////////////////////////////////
    // OUTER BORDER
    //////////////////////////////////////////////////

    doc.lineWidth(8)
      .strokeColor("#D4AF37")
      .rect(20, 20, width - 40, height - 40)
      .stroke();

    //////////////////////////////////////////////////
    // INNER BORDER
    //////////////////////////////////////////////////

    doc.lineWidth(1)
      .strokeColor("#0B1C2D")
      .rect(40, 40, width - 80, height - 80)
      .stroke();

    //////////////////////////////////////////////////
    // HEADER
    //////////////////////////////////////////////////

    doc.fillColor("#0B1C2D")
      .font("Helvetica-Bold")
      .fontSize(24)
      .text("DebugDSA", 0, 80, {
        align: "center"
      });

    doc.fontSize(36)
      .text(
        "CERTIFICATE OF ACHIEVEMENT",
        0,
        120,
        {
          align: "center"
        }
      );

    //////////////////////////////////////////////////
    // BODY
    //////////////////////////////////////////////////

    const bodyStartY = 200;

    doc.font("Helvetica")
      .fontSize(18)
      .fillColor("#000000")
      .text(
        "This certificate is proudly presented to",
        0,
        bodyStartY,
        {
          align: "center"
        }
      );

    doc.font("Helvetica-Bold")
      .fontSize(40)
      .fillColor("#D4AF37")
      .text(
        user.name.toUpperCase(),
        0,
        bodyStartY + 40,
        {
          align: "center"
        }
      );

    doc.font("Helvetica")
      .fontSize(20)
      .fillColor("#000000")
      .text(
        `For successfully earning the ${level} Level Certification`,
        0,
        bodyStartY + 110,
        {
          align: "center"
        }
      );

    doc.fontSize(18)
      .text(
        "by demonstrating excellence in Data Structures and Algorithms",
        0,
        bodyStartY + 145,
        {
          align: "center"
        }
      );

    doc.fontSize(16)
      .text(
        `Total Points Achieved: ${user.points}`,
        0,
        bodyStartY + 175,
        {
          align: "center"
        }
      );

    //////////////////////////////////////////////////
    // SIGNATURES
    //////////////////////////////////////////////////

    const signatureY = height - 150;

    doc.moveTo(120, signatureY)
      .lineTo(320, signatureY)
      .stroke();

    doc.fontSize(14)
      .text(
        "Founder, DebugDSA",
        120,
        signatureY + 8
      );

    doc.moveTo(width - 320, signatureY)
      .lineTo(width - 120, signatureY)
      .stroke();

    doc.text(
      `Date: ${new Date().toDateString()}`,
      width - 320,
      signatureY + 8
    );

    //////////////////////////////////////////////////
    // FOOTER
    //////////////////////////////////////////////////

    const footerY = height - 60;

    doc.fontSize(12)
      .fillColor("#555555")
      .text(
        `Certificate ID: ${certificateId}`,
        60,
        footerY
      );

    doc.text(
      "Verify at: www.debugdsa.com",
      width - 250,
      footerY
    );

    //////////////////////////////////////////////////
    // FINALIZE PDF
    //////////////////////////////////////////////////

    doc.end();

  } catch (err) {

    console.error(
      "CERTIFICATE ERROR:",
      err
    );

    res.status(500).json({
      message: "Server error"
    });

  }
};