package com.careerflow.user;

import com.careerflow.user.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<UserProfileResponse> getMyProfile() {
        return ResponseEntity.ok(userService.getMyProfile());
    }

    @PostMapping("/profile")
    public ResponseEntity<ProfileUpdateResponse> saveProfile(
            @RequestBody UpdateProfileRequest data) {
        return ResponseEntity.ok(userService.saveProfile(data, null, null));
    }

    @PatchMapping("/profile")
    public ResponseEntity<ProfileUpdateResponse> updateProfile(
            @RequestBody UpdateProfileRequest data) {
        return ResponseEntity.ok(userService.updateProfile(data, null, null));
    }

    @PostMapping(value = "/profile/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ProfileUpdateResponse> uploadDocuments(
            @RequestPart(required = false) MultipartFile resume,
            @RequestPart(required = false) MultipartFile coverLetter) {
        return ResponseEntity.ok(userService.saveProfile(null, resume, coverLetter));
    }

    @PatchMapping(value = "/profile/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ProfileUpdateResponse> updateDocuments(
            @RequestPart(required = false) MultipartFile resume,
            @RequestPart(required = false) MultipartFile coverLetter) {
        return ResponseEntity.ok(userService.updateProfile(null, resume, coverLetter));
    }

    @GetMapping("/documents/{id}")
    public ResponseEntity<Resource> downloadDocument(@PathVariable Long id) {
        return userService.downloadDocument(id);
    }
}
