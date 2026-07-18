package com.careerflow.user;

import com.careerflow.common.SecurityUtils;
import com.careerflow.config.FileStorageService;
import com.careerflow.document.Document;
import com.careerflow.document.DocumentRepository;
import com.careerflow.exception.BadRequestException;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.user.dto.EducationDto;
import com.careerflow.user.dto.ProfileUpdateResponse;
import com.careerflow.user.dto.UpdateProfileRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@SuppressWarnings("null")
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private UserResumeRepository userResumeRepository;
    @Mock
    private FileStorageService fileStorageService;
    @Mock
    private DocumentRepository documentRepository;
    @Mock
    private SecurityUtils securityUtils;

    @InjectMocks
    private UserService userService;

    private User currentUser;

    @BeforeEach
    void setUp() {
        currentUser = User.builder().id(1L).firstName("Jane").email("jane@example.com").build();
    }

    @Test
    void saveProfile_updatesFirstName_whenChanged() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);

        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setFirstName("Janet");

        ProfileUpdateResponse response = userService.saveProfile(request);

        assertThat(currentUser.getFirstName()).isEqualTo("Janet");
        assertThat(response.getUpdated()).containsKey("firstName");
        verify(userRepository).save(currentUser);
    }

    @Test
    void saveProfile_ignoresBlankFirstName() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);

        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setFirstName("   ");

        userService.saveProfile(request);

        assertThat(currentUser.getFirstName()).isEqualTo("Jane");
    }

    @Test
    void saveProfile_clearsLastName_whenSetToBlank() {
        currentUser.setLastName("Doe");
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);

        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setLastName("   ");

        ProfileUpdateResponse response = userService.saveProfile(request);

        assertThat(currentUser.getLastName()).isNull();
        assertThat(response.getUpdated()).containsKey("lastName");
    }

    @Test
    void saveProfile_throwsBadRequestException_whenEmailAlreadyInUse() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(userRepository.existsByEmail("taken@example.com")).thenReturn(true);

        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setEmail("taken@example.com");

        assertThatThrownBy(() -> userService.saveProfile(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Email is already in use");
    }

    @ParameterizedTest
    @ValueSource(strings = {"0123456789", "abc", "12"})
    void saveProfile_throwsBadRequestException_forInvalidPhoneNumber(String badPhone) {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);

        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setPhoneNumber(badPhone);

        assertThatThrownBy(() -> userService.saveProfile(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Invalid phone number");
    }

    @Test
    void saveProfile_acceptsValidPhoneNumber() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);

        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setPhoneNumber("+1 415-555-0134");

        userService.saveProfile(request);

        assertThat(currentUser.getPhoneNumber()).isEqualTo("+1 415-555-0134");
    }

    @Test
    void saveProfile_throwsBadRequestException_forInvalidLinkedInUrl() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);

        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setLinkedinUrl("https://notlinkedin.com/in/jane");

        assertThatThrownBy(() -> userService.saveProfile(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("LinkedIn");
    }

    @Test
    void saveProfile_throwsBadRequestException_forInvalidGithubUrl() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);

        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setGithubUrl("not-a-github-url");

        assertThatThrownBy(() -> userService.saveProfile(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("GitHub");
    }

    @Test
    void saveProfile_replacesEducationList_ratherThanAppending() {
        currentUser.setEducation(List.of(edu("Old University")));
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);

        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setEducation(List.of(edu("New University")));

        userService.saveProfile(request);

        assertThat(currentUser.getEducation()).hasSize(1);
        assertThat(currentUser.getEducation().get(0).getInstitution()).isEqualTo("New University");
    }

    @Test
    void updateProfile_appendsToEducationList_insteadOfReplacing() {
        currentUser.setEducation(List.of(edu("Old University")));
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);

        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setEducation(List.of(edu("New University")));

        userService.updateProfile(request);

        assertThat(currentUser.getEducation()).hasSize(2);
        assertThat(currentUser.getEducation())
                .extracting(EducationDto::getInstitution)
                .containsExactly("Old University", "New University");
    }

    @Test
    void updateDocuments_throwsResourceNotFoundException_whenDeleteDocumentIdMatchesNothing() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);

        assertThatThrownBy(() -> userService.updateDocuments(null, null, 999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateDocuments_removesCoverLetter_whenDeleteDocumentIdMatchesIt() {
        Document coverLetter = new Document();
        coverLetter.setId(5L);
        currentUser.setCoverLetter(coverLetter);

        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(userRepository.saveAndFlush(currentUser)).thenReturn(currentUser);

        userService.updateDocuments(null, null, 5L);

        assertThat(currentUser.getCoverLetter()).isNull();
    }

    @Test
    void downloadDocument_throwsResourceNotFoundException_whenNotOwned() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(userResumeRepository.existsByUserIdAndDocumentId(1L, 42L)).thenReturn(false);

        assertThatThrownBy(() -> userService.downloadDocument(42L, true))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    private EducationDto edu(String institution) {
        EducationDto dto = new EducationDto();
        dto.setInstitution(institution);
        return dto;
    }
}
