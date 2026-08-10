package com.careerflow.common;

import com.careerflow.exception.BadRequestException;
import org.springframework.web.multipart.MultipartFile;

import java.util.Set;

public final class DocumentValidation {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(".pdf", ".doc", ".docx");

    private DocumentValidation() {}

    public static void validateExtension(MultipartFile file) {
        String name = file.getOriginalFilename() != null ? file.getOriginalFilename() : "";
        String ext = name.contains(".") ? name.substring(name.lastIndexOf(".")).toLowerCase() : "";
        if (!ALLOWED_EXTENSIONS.contains(ext))
            throw new BadRequestException("Only PDF, DOC, and DOCX files are supported");
    }
}
