-- Add file path columns for contact and banking details
ALTER TABLE vendor_contact_details ADD contact_details_file_path VARCHAR(500);
ALTER TABLE vendor_banking_details ADD banking_details_file_path VARCHAR(500);
