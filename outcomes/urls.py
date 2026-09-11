from django.urls import path
from . import views_pages, views_api

urlpatterns = [
    # Health Check Endpoint
    path('health/', views_api.HealthCheckAPIView.as_view(), name='health_check'),

    # Page Routes
    path('', views_pages.index_view, name='index_view'),
    path('login/', views_pages.login_page, name='login_page'),
    path('register/', views_pages.register_page, name='register_page'),
    path('verify-otp/', views_pages.verify_otp_page, name='verify_otp_page'),
    path('forgot-password/', views_pages.forgot_password_page, name='forgot_password_page'),
    path('trainer/', views_pages.trainer_dashboard_page, name='trainer_dashboard'),
    path('trainee/', views_pages.trainee_dashboard_page, name='trainee_dashboard'),
    path('profile/', views_pages.profile_page, name='profile_page'),
    path('certificate/verify/<str:verification_token>/', views_pages.certificate_verify_page, name='certificate_verify_page'),

    # REST APIs: Authentication
    path('api/auth/register/', views_api.RegisterAPIView.as_view(), name='api_register'),
    path('api/auth/login/', views_api.LoginAPIView.as_view(), name='api_login'),
    path('api/auth/logout/', views_api.LogoutAPIView.as_view(), name='api_logout'),
    path('api/auth/send-otp/', views_api.SendOTPAPIView.as_view(), name='api_send_otp'),
    path('api/auth/verify-otp/', views_api.VerifyOTPAPIView.as_view(), name='api_verify_otp'),
    path('api/auth/password-reset/', views_api.PasswordResetAPIView.as_view(), name='api_password_reset'),
    path('api/auth/change-password/', views_api.ChangePasswordAPIView.as_view(), name='api_change_password'),
    path('api/auth/me/', views_api.CurrentUserAPIView.as_view(), name='api_current_user'),

    # REST APIs: Profile & Localization
    path('api/profile/', views_api.ProfileAPIView.as_view(), name='api_profile'),
    path('api/profile/photo/', views_api.ProfilePhotoUploadAPIView.as_view(), name='api_profile_photo'),
    path('api/i18n/languages/', views_api.LanguageListAPIView.as_view(), name='api_languages'),
    path('api/i18n/set-language/', views_api.SetLanguageAPIView.as_view(), name='api_set_language'),

    # REST APIs: Trainer & Outcomes Management
    path('api/trainer/dashboard/', views_api.TrainerDashboardAPIView.as_view(), name='api_trainer_dashboard'),
    path('api/trainer/govt-courses/', views_api.TrainerGovtCoursesAPIView.as_view(), name='api_trainer_govt_courses'),
    path('api/trainer/courses/analytics/', views_api.TrainerCourseAnalyticsAPIView.as_view(), name='api_trainer_course_analytics'),
    path('api/trainer/courses/efficiency/', views_api.TrainerCourseEfficiencyAPIView.as_view(), name='api_trainer_course_efficiency'),
    path('api/trainer/courses/create/', views_api.TrainerCreateCourseAPIView.as_view(), name='api_trainer_create_course'),
    path('api/trainer/courses/custom-list/', views_api.TrainerCustomCourseListAPIView.as_view(), name='api_trainer_custom_course_list'),
    path('api/trainer/placements/confirmation/', views_api.TrainerPlacementConfirmationAPIView.as_view(), name='api_trainer_placement_confirmation'),
    path('api/trainer/placements/confirm-action/', views_api.TrainerConfirmPlacementActionAPIView.as_view(), name='api_trainer_confirm_placement_action'),
    path('api/trainer/qualification/', views_api.TrainerQualificationAPIView.as_view(), name='api_trainer_qualification'),
    path('api/trainer/qualification/verify/', views_api.TrainerQualificationVerifyAPIView.as_view(), name='api_trainer_qualification_verify'),
    path('api/outcomes/trainees/', views_api.TraineeListCreateAPIView.as_view(), name='api_trainees_list_create'),
    path('api/outcomes/trainees/<int:pk>/', views_api.TraineeDetailAPIView.as_view(), name='api_trainee_detail'),
    path('api/outcomes/trainees/seed-demo/', views_api.SeedDemoTraineesAPIView.as_view(), name='api_seed_trainees'),
    path('api/outcomes/follow-ups/', views_api.FollowUpListCreateAPIView.as_view(), name='api_follow_ups_list_create'),
    path('api/outcomes/follow-ups/<int:pk>/', views_api.FollowUpDetailAPIView.as_view(), name='api_follow_up_detail'),
    path('api/outcomes/follow-ups/seed-demo/', views_api.SeedDemoFollowUpsAPIView.as_view(), name='api_seed_follow_ups'),
    path('api/outcomes/follow-ups/<int:pk>/send/', views_api.SendFollowUpAPIView.as_view(), name='api_send_follow_up'),
    path('api/outcomes/placements/', views_api.PlacementListCreateAPIView.as_view(), name='api_placements_list_create'),
    path('api/outcomes/consents/', views_api.RecordConsentAPIView.as_view(), name='api_record_consent'),
    path('api/reports/provider-export/', views_api.ProviderReportExportAPIView.as_view(), name='api_provider_export'),
    path('api/reports/impact-export/', views_api.ImpactReportExportAPIView.as_view(), name='api_impact_export'),
    path('api/reports/history/', views_api.ReportDownloadHistoryAPIView.as_view(), name='api_report_history'),

    # REST APIs: Course Management (Trainer)
    path('api/courses/', views_api.CourseListCreateAPIView.as_view(), name='api_courses_list_create'),
    path('api/courses/<int:pk>/', views_api.CourseDetailAPIView.as_view(), name='api_course_detail'),
    path('api/courses/<int:pk>/publish/', views_api.CoursePublishAPIView.as_view(), name='api_course_publish'),
    path('api/courses/<int:pk>/close/', views_api.CourseCloseAPIView.as_view(), name='api_course_close'),
    path('api/courses/<int:pk>/applications/', views_api.CourseApplicationsListAPIView.as_view(), name='api_course_applications_list'),
    path('api/courses/applications/<int:pk>/review/', views_api.CourseApplicationReviewAPIView.as_view(), name='api_course_application_review'),
    path('api/courses/<int:pk>/enrollments/', views_api.CourseEnrollmentsListAPIView.as_view(), name='api_course_enrollments_list'),
    path('api/courses/enrollments/<int:pk>/', views_api.EnrollmentDetailAPIView.as_view(), name='api_enrollment_detail'),
    path('api/courses/enrollments/<int:pk>/certificate/', views_api.CourseIssueCertificateAPIView.as_view(), name='api_course_issue_certificate'),
    path('api/courses/enrollments/<int:pk>/remind/', views_api.CourseSendOutcomeReminderAPIView.as_view(), name='api_course_send_outcome_reminder'),
    path('api/courses/outcomes/<int:pk>/verify/', views_api.CourseVerifyOutcomeAPIView.as_view(), name='api_course_verify_outcome'),
    path('api/courses/<int:pk>/analytics/', views_api.CourseAnalyticsAPIView.as_view(), name='api_course_analytics'),
    path('api/courses/<int:pk>/performance/', views_api.CoursePerformanceExplorerAPIView.as_view(), name='api_course_performance_explorer'),

    # REST APIs: Trainee Self-Service & Course Learning
    path('api/trainee/me/dashboard/', views_api.TraineeSelfDashboardAPIView.as_view(), name='api_trainee_self_dashboard'),
    path('api/trainee/me/profile/', views_api.ProfileAPIView.as_view(), name='api_trainee_self_profile'),
    path('api/trainee/me/follow-ups/<int:pk>/respond/', views_api.TraineeRespondFollowUpAPIView.as_view(), name='api_trainee_respond_follow_up'),
    path('api/trainee/me/progress-report/', views_api.TraineeProgressReportAPIView.as_view(), name='api_trainee_progress_report'),
    path('api/trainee/me/consent/', views_api.RecordConsentAPIView.as_view(), name='api_trainee_consent'),
    path('api/trainee/courses/', views_api.TraineeBrowseCoursesAPIView.as_view(), name='api_trainee_browse_courses'),
    path('api/trainee/courses/<int:pk>/apply/', views_api.TraineeApplyCourseAPIView.as_view(), name='api_trainee_apply_course'),
    path('api/trainee/me/applications/', views_api.TraineeMyApplicationsAPIView.as_view(), name='api_trainee_my_applications'),
    path('api/trainee/me/enrollments/', views_api.TraineeMyEnrollmentsAPIView.as_view(), name='api_trainee_my_enrollments'),
    path('api/trainee/me/enrollments/<int:pk>/outcome/', views_api.TraineeOutcomeAPIView.as_view(), name='api_trainee_enrollment_outcome'),
    path('api/trainee/trainer-classes/', views_api.TraineeTrainerClassesAPIView.as_view(), name='api_trainee_trainer_classes'),
    path('api/trainee/streak-attendance/', views_api.TraineeStreakAttendanceAPIView.as_view(), name='api_trainee_streak_attendance'),
    path('api/trainee/govt-courses/', views_api.TraineeGovtCoursesAPIView.as_view(), name='api_trainee_govt_courses'),
    path('api/trainee/schemes/', views_api.TraineeSchemesAPIView.as_view(), name='api_trainee_schemes'),
    path('api/trainee/placement-submit/', views_api.TraineePlacementSubmitAPIView.as_view(), name='api_trainee_placement_submit'),
    path('api/trainee/ai-recommendations/', views_api.TraineeAICourseRecommendationAPIView.as_view(), name='api_trainee_ai_recommendations'),

    # REST APIs: 4-Digit Phone SMS OTP
    path('api/auth/phone-sms-otp/', views_api.PhoneSMSOTPAPIView.as_view(), name='api_phone_sms_otp'),
    path('api/auth/phone-verify-reset/', views_api.PhoneVerifyResetAPIView.as_view(), name='api_phone_verify_reset'),

    # REST APIs: Certificates & Notifications
    path('api/certificates/<int:pk>/download/', views_api.CertificateDownloadAPIView.as_view(), name='api_certificate_download'),
    path('api/certificates/verify/<str:token>/', views_api.PublicCertificateVerifyAPIView.as_view(), name='api_public_certificate_verify'),
    path('api/notifications/', views_api.NotificationListAPIView.as_view(), name='api_notifications_list'),
    path('api/notifications/<int:pk>/read/', views_api.NotificationMarkReadAPIView.as_view(), name='api_notification_mark_read'),
    path('api/notifications/read-all/', views_api.NotificationMarkReadAPIView.as_view(), name='api_notifications_mark_all_read'),

    # Public 1-Click Employer Verification
    path('employer/verify/<str:token>/', views_pages.employer_verify_page, name='employer_verify_page'),
    path('api/employer/verify/<str:token>/', views_api.EmployerPlacementVerifyAPIView.as_view(), name='api_employer_placement_verify'),

    # REST APIs: Student Feedback & Ratings
    path('api/feedback/submit/', views_api.FeedbackSubmitAPIView.as_view(), name='api_feedback_submit'),
    path('api/feedback/trainer/analytics/', views_api.TrainerFeedbackAnalyticsAPIView.as_view(), name='api_trainer_feedback_analytics'),
    path('api/feedback/trainee/my-feedback/', views_api.TraineeMyFeedbackAPIView.as_view(), name='api_trainee_my_feedback'),
]

