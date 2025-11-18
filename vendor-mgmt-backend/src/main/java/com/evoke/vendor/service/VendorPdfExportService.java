package com.evoke.vendor.service;

import com.evoke.vendor.dto.response.VendorRequestResponse;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Service for exporting vendor data to PDF format
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class VendorPdfExportService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm");
    private static final DeviceRgb HEADER_COLOR = new DeviceRgb(59, 130, 246); // Blue
    private static final DeviceRgb ALT_ROW_COLOR = new DeviceRgb(249, 250, 251); // Light gray

    /**
     * Export vendor list to PDF
     */
    public byte[] exportVendorListToPdf(List<VendorRequestResponse> vendors) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);

            // Add title
            Paragraph title = new Paragraph("Vendor Management Report")
                    .setFontSize(20)
                    .setBold()
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(10);
            document.add(title);

            // Add generation date
            Paragraph dateInfo = new Paragraph("Generated on: " + LocalDateTime.now().format(DATE_FORMATTER))
                    .setFontSize(10)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(20);
            document.add(dateInfo);

            // Add summary
            Paragraph summary = new Paragraph(String.format("Total Vendors: %d", vendors.size()))
                    .setFontSize(12)
                    .setBold()
                    .setMarginBottom(10);
            document.add(summary);

            // Create table
            float[] columnWidths = {1, 2, 2, 1.5f, 1.5f, 1.5f};
            Table table = new Table(UnitValue.createPercentArray(columnWidths));
            table.setWidth(UnitValue.createPercentValue(100));

            // Add headers
            addHeaderCell(table, "ID");
            addHeaderCell(table, "Vendor Name");
            addHeaderCell(table, "Email");
            addHeaderCell(table, "Contact Person");
            addHeaderCell(table, "Category");
            addHeaderCell(table, "Status");

            // Add data rows
            int rowIndex = 0;
            for (VendorRequestResponse vendor : vendors) {
                boolean isAlternateRow = rowIndex % 2 == 1;
                
                addDataCell(table, String.valueOf(vendor.getId()), isAlternateRow);
                addDataCell(table, vendor.getVendorName(), isAlternateRow);
                addDataCell(table, vendor.getVendorEmail(), isAlternateRow);
                addDataCell(table, vendor.getContactPerson(), isAlternateRow);
                addDataCell(table, vendor.getVendorCategory(), isAlternateRow);
                addStatusCell(table, vendor.getStatus(), isAlternateRow);
                
                rowIndex++;
            }

            document.add(table);

            // Add footer
            Paragraph footer = new Paragraph("\n\nThis is a system-generated report.")
                    .setFontSize(8)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontColor(ColorConstants.GRAY);
            document.add(footer);

            document.close();
            
            log.info("PDF exported successfully with {} vendors", vendors.size());
            return baos.toByteArray();
            
        } catch (Exception e) {
            log.error("Error generating PDF export", e);
            throw new RuntimeException("Failed to generate PDF export", e);
        }
    }

    /**
     * Export detailed vendor report including onboarding status
     */
    public byte[] exportDetailedVendorReport(List<VendorRequestResponse> vendors) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);

            // Add title
            Paragraph title = new Paragraph("Detailed Vendor Onboarding Report")
                    .setFontSize(20)
                    .setBold()
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(10);
            document.add(title);

            // Add generation date
            Paragraph dateInfo = new Paragraph("Generated on: " + LocalDateTime.now().format(DATE_FORMATTER))
                    .setFontSize(10)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(20);
            document.add(dateInfo);

            // Add statistics
            long requestedCount = vendors.stream().filter(v -> "REQUESTED".equals(v.getStatus())).count();
            long validatedCount = vendors.stream().filter(v -> "VALIDATED".equals(v.getStatus())).count();
            long pendingCount = vendors.stream().filter(v -> "AWAITING_VALIDATION".equals(v.getStatus()) 
                    || "AWAITING_RESPONSE".equals(v.getStatus())).count();

            Table statsTable = new Table(UnitValue.createPercentArray(new float[]{1, 1, 1, 1}));
            statsTable.setWidth(UnitValue.createPercentValue(100));
            statsTable.setMarginBottom(20);

            addStatsCell(statsTable, "Total", String.valueOf(vendors.size()));
            addStatsCell(statsTable, "Requested", String.valueOf(requestedCount));
            addStatsCell(statsTable, "Validated", String.valueOf(validatedCount));
            addStatsCell(statsTable, "Pending", String.valueOf(pendingCount));

            document.add(statsTable);

            // Create detailed table
            float[] columnWidths = {0.5f, 2, 2, 1.5f, 1.5f, 1.5f, 2};
            Table table = new Table(UnitValue.createPercentArray(columnWidths));
            table.setWidth(UnitValue.createPercentValue(100));

            // Add headers
            addHeaderCell(table, "ID");
            addHeaderCell(table, "Vendor Name");
            addHeaderCell(table, "Email");
            addHeaderCell(table, "Contact");
            addHeaderCell(table, "Category");
            addHeaderCell(table, "Status");
            addHeaderCell(table, "Created Date");

            // Add data rows
            int rowIndex = 0;
            for (VendorRequestResponse vendor : vendors) {
                boolean isAlternateRow = rowIndex % 2 == 1;
                
                addDataCell(table, String.valueOf(vendor.getId()), isAlternateRow);
                addDataCell(table, vendor.getVendorName(), isAlternateRow);
                addDataCell(table, vendor.getVendorEmail(), isAlternateRow);
                addDataCell(table, vendor.getContactPerson(), isAlternateRow);
                addDataCell(table, vendor.getVendorCategory(), isAlternateRow);
                addStatusCell(table, vendor.getStatus(), isAlternateRow);
                addDataCell(table, formatDate(vendor.getCreatedAt()), isAlternateRow);
                
                rowIndex++;
            }

            document.add(table);

            // Add footer
            Paragraph footer = new Paragraph("\n\nThis is a confidential system-generated report.")
                    .setFontSize(8)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontColor(ColorConstants.GRAY);
            document.add(footer);

            document.close();
            
            log.info("Detailed PDF report exported successfully with {} vendors", vendors.size());
            return baos.toByteArray();
            
        } catch (Exception e) {
            log.error("Error generating detailed PDF report", e);
            throw new RuntimeException("Failed to generate detailed PDF report", e);
        }
    }

    private void addHeaderCell(Table table, String text) {
        Cell cell = new Cell()
                .add(new Paragraph(text).setBold().setFontColor(ColorConstants.WHITE))
                .setBackgroundColor(HEADER_COLOR)
                .setTextAlignment(TextAlignment.CENTER)
                .setPadding(8);
        table.addHeaderCell(cell);
    }

    private void addDataCell(Table table, String text, boolean isAlternateRow) {
        Cell cell = new Cell()
                .add(new Paragraph(text != null ? text : "N/A").setFontSize(9))
                .setTextAlignment(TextAlignment.LEFT)
                .setPadding(6);
        
        if (isAlternateRow) {
            cell.setBackgroundColor(ALT_ROW_COLOR);
        }
        
        table.addCell(cell);
    }

    private void addStatusCell(Table table, String status, boolean isAlternateRow) {
        DeviceRgb statusColor = getStatusColor(status);
        
        Cell cell = new Cell()
                .add(new Paragraph(status != null ? status : "N/A")
                        .setFontSize(9)
                        .setBold()
                        .setFontColor(statusColor))
                .setTextAlignment(TextAlignment.CENTER)
                .setPadding(6);
        
        if (isAlternateRow) {
            cell.setBackgroundColor(ALT_ROW_COLOR);
        }
        
        table.addCell(cell);
    }

    private void addStatsCell(Table table, String label, String value) {
        Cell labelCell = new Cell()
                .add(new Paragraph(label).setBold().setFontSize(10))
                .setTextAlignment(TextAlignment.CENTER)
                .setBackgroundColor(new DeviceRgb(243, 244, 246))
                .setPadding(8);
        table.addCell(labelCell);

        Cell valueCell = new Cell()
                .add(new Paragraph(value).setBold().setFontSize(14).setFontColor(HEADER_COLOR))
                .setTextAlignment(TextAlignment.CENTER)
                .setPadding(8);
        table.addCell(valueCell);
    }

    private DeviceRgb getStatusColor(String status) {
        if (status == null) return new DeviceRgb(0, 0, 0); // Black
        
        return switch (status) {
            case "VALIDATED" -> new DeviceRgb(16, 185, 129); // Green
            case "REQUESTED" -> new DeviceRgb(59, 130, 246); // Blue
            case "AWAITING_RESPONSE", "AWAITING_VALIDATION" -> new DeviceRgb(245, 158, 11); // Orange
            case "MISSING_DATA" -> new DeviceRgb(239, 68, 68); // Red
            case "DENIED", "DELETED" -> new DeviceRgb(156, 163, 175); // Gray
            default -> new DeviceRgb(0, 0, 0); // Black
        };
    }

    private String formatDate(LocalDateTime date) {
        if (date == null) return "N/A";
        return date.format(DATE_FORMATTER);
    }
}
