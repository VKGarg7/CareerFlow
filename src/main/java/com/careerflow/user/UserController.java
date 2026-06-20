package com.careerflow.user;

import com.careerflow.user.dto.*;
import lombok.RequiredArgsConstructor;
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

    @PostMapping(value = "/profile", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserProfileResponse> setupProfile(
            @RequestParam(required = false) String firstName,
            @RequestParam(required = false) String lastName,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String phoneNumber,
            @RequestParam(required = false) String linkedinUrl,
            @RequestParam(required = false) String githubUrl,
            @RequestParam(required = false) String portfolioUrl,
            @RequestParam(required = false) String bio,
            @RequestPart(required = false) MultipartFile resume,
            @RequestPart(required = false) MultipartFile coverLetter) {
        return ResponseEntity.ok(userService.saveProfile(
                buildRequest(firstName, lastName, email, phoneNumber, linkedinUrl, githubUrl, portfolioUrl, bio),
                resume, coverLetter));
    }

    @PatchMapping(value = "/profile", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserProfileResponse> updateProfile(
            @RequestParam(required = false) String firstName,
            @RequestParam(required = false) String lastName,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String phoneNumber,
            @RequestParam(required = false) String linkedinUrl,
            @RequestParam(required = false) String githubUrl,
            @RequestParam(required = false) String portfolioUrl,
            @RequestParam(required = false) String bio,
            @RequestPart(required = false) MultipartFile resume,
            @RequestPart(required = false) MultipartFile coverLetter) {
        return ResponseEntity.ok(userService.saveProfile(
                buildRequest(firstName, lastName, email, phoneNumber, linkedinUrl, githubUrl, portfolioUrl, bio),
                resume, coverLetter));
    }

    @PostMapping("/education")
    public ResponseEntity<UserProfileResponse> addEducation(@RequestBody EducationDto dto) {
        return ResponseEntity.ok(userService.addEducation(dto));
    }

    @PostMapping("/experience")
    public ResponseEntity<UserProfileResponse> addExperience(@RequestBody ExperienceDto dto) {
        return ResponseEntity.ok(userService.addExperience(dto));
    }

    @PostMapping("/projects")
    public ResponseEntity<UserProfileResponse> addProject(@RequestBody ProjectDto dto) {
        return ResponseEntity.ok(userService.addProject(dto));
    }

    private UpdateProfileRequest buildRequest(String firstName, String lastName, String email,
                                              String phoneNumber, String linkedinUrl, String githubUrl,
                                              String portfolioUrl, String bio) {
        UpdateProfileRequest req = new UpdateProfileRequest();
        req.setFirstName(firstName);
        req.setLastName(lastName);
        req.setEmail(email);
        req.setPhoneNumber(phoneNumber);
        req.setLinkedinUrl(linkedinUrl);
        req.setGithubUrl(githubUrl);
        req.setPortfolioUrl(portfolioUrl);
        req.setBio(bio);
        return req;
    }
}
