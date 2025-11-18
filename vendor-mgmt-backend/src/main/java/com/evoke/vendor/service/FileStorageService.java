package com.evoke.vendor.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.Objects;
import java.util.UUID;

@Service
@Slf4j
public class FileStorageService {

    private final Path fileStorageLocation;

    @Value("${application.file.allowed-extensions}")
    private String allowedExtensions;

    public FileStorageService(@Value("${application.file.upload-dir}") String uploadDir) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (IOException ex) {
            log.error("Could not create the directory where the uploaded files will be stored.", ex);
            throw new RuntimeException("Could not create upload directory", ex);
        }
    }

    public String storeFile(MultipartFile file) {
        Objects.requireNonNull(file, "File cannot be null");
        
        String fileName = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));

        try {
            if (fileName.contains("..")) {
                throw new IllegalArgumentException("Filename contains invalid path sequence: " + fileName);
            }

            if (!isValidFileExtension(fileName)) {
                throw new IllegalArgumentException("File extension not allowed: " + fileName);
            }

            String fileExtension = getFileExtension(fileName);
            String storedFileName = UUID.randomUUID() + "." + fileExtension;

            Path targetLocation = this.fileStorageLocation.resolve(storedFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            log.info("File stored successfully: {}", storedFileName);
            return storedFileName;
            
        } catch (IOException ex) {
            log.error("Could not store file: {}", fileName, ex);
            throw new RuntimeException("Could not store file: " + fileName, ex);
        }
    }

    public Path loadFile(String fileName) {
        Objects.requireNonNull(fileName, "Filename cannot be null");
        return fileStorageLocation.resolve(fileName).normalize();
    }

    public void deleteFile(String fileName) {
        try {
            Path filePath = loadFile(fileName);
            Files.deleteIfExists(filePath);
            log.info("File deleted successfully: {}", fileName);
        } catch (IOException ex) {
            log.error("Could not delete file: {}", fileName, ex);
        }
    }

    private boolean isValidFileExtension(String fileName) {
        String extension = getFileExtension(fileName);
        String[] allowed = allowedExtensions.split(",");
        return Arrays.asList(allowed).contains(extension.toLowerCase());
    }

    private String getFileExtension(String fileName) {
        if (fileName.contains(".")) {
            return fileName.substring(fileName.lastIndexOf(".") + 1);
        }
        return "";
    }

    public boolean validatePdfFile(MultipartFile file) {
        Objects.requireNonNull(file, "File cannot be null");
        
        String contentType = file.getContentType();
        return "application/pdf".equals(contentType);
    }
}
