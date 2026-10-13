// Package apperr provides stable error codes and English user-facing messages.
// Historical Chinese strings remain parseable by the web UI; new writes use English.
package apperr

import (
	"errors"
	"fmt"
)

// Code is a stable, locale-neutral identifier for user-facing failures.
type Code string

const (
	CookieRequired           Code = "cookie_required"
	CookieDisabled           Code = "cookie_disabled"
	NoCookie                 Code = "no_cookie"
	NoClient                 Code = "no_client"
	AllCookiesUnavailable    Code = "all_cookies_unavailable"
	RateLimited              Code = "rate_limited"
	LoginVerifyFailed        Code = "login_verify_failed"
	LoginAccountUnrecognized Code = "login_account_unrecognized"
	LoginVerifyOK            Code = "login_verify_ok"
	UserEmpty                Code = "user_empty"
	UserUnavailable          Code = "user_unavailable"
	ListNotFound             Code = "list_not_found"
	NoUserLegacy             Code = "no_user_legacy"
	TimelineParseFailed      Code = "timeline_parse_failed"
	APIRequestFailed         Code = "api_request_failed"
	TooManyRedirects         Code = "too_many_redirects"
	CrossDomainRedirect      Code = "cross_domain_redirect"
	AuthRequired             Code = "auth_required"

	NoMedia               Code = "no_media"
	LinkEmpty             Code = "link_empty"
	InvalidLink           Code = "invalid_link"
	TweetLinkRequired     Code = "tweet_link_required"
	NoTweetResult         Code = "no_tweet_result"
	NoLegacyTweet         Code = "no_legacy_tweet"
	TweetDetailHTTPFailed Code = "tweet_detail_http_failed"
	TweetDetailNotJSON    Code = "tweet_detail_not_json"
	TweetDetailNoData     Code = "tweet_detail_no_data"
	TweetUnavailable      Code = "tweet_unavailable"

	JobListEmpty             Code = "job_list_empty"
	JobBatchTooLarge         Code = "job_batch_too_large"
	NoCreatableJobs          Code = "no_creatable_jobs"
	JobInputEmpty            Code = "job_input_empty"
	InvalidMediaURL          Code = "invalid_media_url"
	MediaURLDomain           Code = "media_url_domain"
	UnsupportedJobKind       Code = "unsupported_job_kind"
	EventBusUnavailable      Code = "event_bus_unavailable"
	EventSubLimit            Code = "event_sub_limit"
	FileNotFound             Code = "file_not_found"
	NoVideoPoster            Code = "no_video_poster"
	PosterFetchCanceled      Code = "poster_fetch_canceled"
	PosterDownloadFailed     Code = "poster_download_failed"
	InvalidPosterURL         Code = "invalid_poster_url"
	PosterFetchBusy          Code = "poster_fetch_busy"
	VideoPosterUnavailable   Code = "video_poster_unavailable"
	InvalidVideoPosterFormat Code = "invalid_video_poster_format"
	InvalidFilePath          Code = "invalid_file_path"
	DownloadDirMissing       Code = "download_dir_missing"
	FileOutsideDownloadDir   Code = "file_outside_download_dir"
	MissingFilePath          Code = "missing_file_path"
	MediaFilesOnly           Code = "media_files_only"
	JSONContentTypeRequired  Code = "json_content_type_required"
	PathResolveFailed        Code = "path_resolve_failed"
	DirAccessDenied          Code = "dir_access_denied"
	NotADirectory            Code = "not_a_directory"
	DownloadDirEmpty         Code = "download_dir_empty"
	DownloadDirInvalid       Code = "download_dir_invalid"
	DownloadDirRootOrHome    Code = "download_dir_root_or_home"
	DownloadDirNotAllowed    Code = "download_dir_not_allowed"
	DirPathEmpty             Code = "dir_path_empty"
	DirCreateDenied          Code = "dir_create_denied"

	RejectCrossSite    Code = "reject_cross_site"
	RejectOpaqueOrigin Code = "reject_opaque_origin"
	RejectCrossOrigin  Code = "reject_cross_origin"
	HostNotAllowed     Code = "host_not_allowed"

	BodyTooLarge               Code = "body_too_large"
	RejectNonHTTPRedirect      Code = "reject_non_http_redirect"
	RejectRedirectHost         Code = "reject_redirect_host"
	InvalidProxyURL            Code = "invalid_proxy_url"
	UnsupportedProxyScheme     Code = "unsupported_proxy_scheme"
	ProxyMissingHost           Code = "proxy_missing_host"
	HTTPTransportInitFailed    Code = "http_transport_init_failed"
	RejectNonHTTPMediaRedirect Code = "reject_non_http_media_redirect"
	RejectMediaRedirectHost    Code = "reject_media_redirect_host"
	InvalidContentType         Code = "invalid_content_type"

	ScheduleJobStillRunning  Code = "schedule_job_still_running"
	MarkUnavailableFailed    Code = "mark_unavailable_failed"
	LinkPathExists           Code = "link_path_exists"
	SchemaTooNew             Code = "schema_too_new"
	ScheduleAlreadyClaimed   Code = "schedule_already_claimed"
	WALModeFailed            Code = "wal_mode_failed"
	JournalModeStuck         Code = "journal_mode_stuck"
	SchemaDowngradeBlocked   Code = "schema_downgrade_blocked"
	JobRetryBusy             Code = "job_retry_busy"
	ScheduleIntervalTooShort Code = "schedule_interval_too_short"
	ScheduleIntervalTooLong  Code = "schedule_interval_too_long"
	ScheduleTargetsEmpty     Code = "schedule_targets_empty"
	ScheduleTooManyTargets   Code = "schedule_too_many_targets"
	ScheduleUnsupportedKind  Code = "schedule_unsupported_kind"
)

// Error is a coded application error with an English Error() string.
type Error struct {
	Code Code
	msg  string
	err  error
}

func (e *Error) Error() string {
	if e == nil {
		return ""
	}
	return e.msg
}

func (e *Error) Unwrap() error { return e.err }

func (e *Error) Is(target error) bool {
	t, ok := target.(*Error)
	if !ok || e == nil || t == nil {
		return false
	}
	return e.Code != "" && e.Code == t.Code
}

var templates = map[Code]string{
	CookieRequired:           "Configure auth_token and ct0 first",
	CookieDisabled:           "X cookie marked unavailable",
	NoCookie:                 "No available cookie",
	NoClient:                 "No available X client",
	AllCookiesUnavailable:    "All X cookies are unavailable",
	RateLimited:              "X clients temporarily rate limited; retry later",
	LoginVerifyFailed:        "X login verification failed: HTTP %d",
	LoginAccountUnrecognized: "Could not identify logged-in account from X home",
	LoginVerifyOK:            "X login verification succeeded",
	UserEmpty:                "User cannot be empty",
	UserUnavailable:          "User unavailable",
	ListNotFound:             "List not found",
	NoUserLegacy:             "Response has no user legacy data",
	TimelineParseFailed:      "Failed to parse timeline instructions",
	APIRequestFailed:         "X API request failed: HTTP %d",
	TooManyRedirects:         "Too many redirects",
	CrossDomainRedirect:      "Rejected cross-domain redirect: %s",
	AuthRequired:             "auth_token and ct0 are required for X GraphQL",

	NoMedia:               "This tweet has no downloadable media",
	LinkEmpty:             "Link cannot be empty",
	InvalidLink:           "Invalid link: %s",
	TweetLinkRequired:     "Enter an x.com or twitter.com tweet link",
	NoTweetResult:         "No tweet result in payload",
	NoLegacyTweet:         "No legacy tweet in payload",
	TweetDetailHTTPFailed: "X tweet detail request failed: HTTP %d",
	TweetDetailNotJSON:    "X tweet detail returned non-JSON content",
	TweetDetailNoData:     "X tweet detail response has no tweet data",
	TweetUnavailable:      "Tweet unavailable (deleted or restricted)",

	JobListEmpty:             "Job list cannot be empty",
	JobBatchTooLarge:         "At most 200 jobs can be created at once",
	NoCreatableJobs:          "No jobs to create",
	JobInputEmpty:            "Job input cannot be empty",
	InvalidMediaURL:          "Enter a valid media URL",
	MediaURLDomain:           "Media URLs must use the twimg.com domain",
	UnsupportedJobKind:       "Unsupported job type: %s",
	EventBusUnavailable:      "Event bus unavailable",
	EventSubLimit:            "Event subscription connection limit reached",
	FileNotFound:             "File not found",
	NoVideoPoster:            "No video poster available",
	PosterFetchCanceled:      "Poster fetch canceled",
	PosterDownloadFailed:     "Failed to download video poster",
	InvalidPosterURL:         "Invalid poster URL",
	PosterFetchBusy:          "Poster fetch busy",
	VideoPosterUnavailable:   "Video poster unavailable",
	InvalidVideoPosterFormat: "Invalid video poster format",
	InvalidFilePath:          "Invalid file path",
	DownloadDirMissing:       "Download directory does not exist: %w",
	FileOutsideDownloadDir:   "File is outside the download directory",
	MissingFilePath:          "Missing file path",
	MediaFilesOnly:           "Only media files are supported",
	JSONContentTypeRequired:  "Content-Type must be application/json",
	PathResolveFailed:        "Cannot resolve path: %s",
	DirAccessDenied:          "Directory access denied (home and download directory only)",
	NotADirectory:            "%s is not a directory",
	DownloadDirEmpty:         "Download directory cannot be empty",
	DownloadDirInvalid:       "Invalid download directory: %w",
	DownloadDirRootOrHome:    "Download directory cannot be the filesystem root or home directory; choose a subdirectory",
	DownloadDirNotAllowed:    "Download directory not allowed: home or current download directory only; to use another location (e.g. external disk), start with OPEN_XDOWNLOAD_DOWNLOAD_DIR",
	DirPathEmpty:             "Directory path cannot be empty",
	DirCreateDenied:          "Cannot create directory at this location (home and download directory only)",

	RejectCrossSite:    "Rejected cross-site request",
	RejectOpaqueOrigin: "Rejected opaque-origin request",
	RejectCrossOrigin:  "Rejected cross-origin request",
	HostNotAllowed:     "Host not in allowlist: when accessing by domain, add it to OPEN_XDOWNLOAD_ALLOWED_HOSTS",

	BodyTooLarge:               "Response body exceeds size limit",
	RejectNonHTTPRedirect:      "Rejected non-HTTP redirect: %s",
	RejectRedirectHost:         "Rejected redirect to %s",
	InvalidProxyURL:            "Invalid proxy URL: %w",
	UnsupportedProxyScheme:     "Unsupported proxy scheme: %s",
	ProxyMissingHost:           "Proxy URL missing hostname",
	HTTPTransportInitFailed:    "HTTP transport initialization failed",
	RejectNonHTTPMediaRedirect: "Rejected non-HTTP media redirect: %s",
	RejectMediaRedirectHost:    "Rejected media redirect to non-twimg.com host: %s",
	InvalidContentType:         "Invalid content type: %s",

	ScheduleJobStillRunning:  "The previous job for this schedule is still running",
	MarkUnavailableFailed:    "Failed to record permanently unavailable media: %v: %w",
	LinkPathExists:           "Link path %s already exists and is not a symlink or file",
	SchemaTooNew:             "Database schema version is newer than this program",
	ScheduleAlreadyClaimed:   "Archive schedule already claimed by another run",
	WALModeFailed:            "Failed to switch database to WAL mode: %w",
	JournalModeStuck:         "journal_mode still %q after switch",
	SchemaDowngradeBlocked:   "%w: database is v%d, this program only supports up to v%d. Upgrade the program or restore a pre-upgrade backup",
	JobRetryBusy:             "Job is still running or queued and cannot be retried",
	ScheduleIntervalTooShort: "Schedule interval cannot be less than %d minutes",
	ScheduleIntervalTooLong:  "Schedule interval cannot exceed %d minutes",
	ScheduleTargetsEmpty:     "Schedule targets cannot be empty",
	ScheduleTooManyTargets:   "Schedule can include at most %d targets",
	ScheduleUnsupportedKind:  "Unsupported schedule target type: %s",
}

// Sentinels for errors.Is / errors.As.
var (
	ErrRateLimited            = &Error{Code: RateLimited, msg: templates[RateLimited]}
	ErrClientDisabled         = &Error{Code: CookieDisabled, msg: templates[CookieDisabled]}
	ErrNoClient               = &Error{Code: NoClient, msg: templates[NoClient]}
	ErrBodyTooLarge           = &Error{Code: BodyTooLarge, msg: templates[BodyTooLarge]}
	ErrSchemaTooNew           = &Error{Code: SchemaTooNew, msg: templates[SchemaTooNew]}
	ErrArchiveScheduleClaimed = &Error{Code: ScheduleAlreadyClaimed, msg: templates[ScheduleAlreadyClaimed]}
	ErrJobRetryBusy           = &Error{Code: JobRetryBusy, msg: templates[JobRetryBusy]}
	ErrFileOutsideDownloadDir = &Error{Code: FileOutsideDownloadDir, msg: templates[FileOutsideDownloadDir]}
	ErrNoMedia                = &Error{Code: NoMedia, msg: templates[NoMedia]}
)

// E builds an English error for code. Args are passed to the template via fmt.Sprintf
// (or fmt.Errorf when the template contains %w).
func E(code Code, args ...any) error {
	tmpl, ok := templates[code]
	if !ok {
		if len(args) == 0 {
			return &Error{Code: code, msg: string(code)}
		}
		return &Error{Code: code, msg: fmt.Sprintf("%s: %v", code, args)}
	}
	if len(args) == 0 {
		return &Error{Code: code, msg: tmpl}
	}
	// Templates with %w must use fmt.Errorf so wrapping works; Code is not attached.
	for i := 0; i < len(tmpl)-1; i++ {
		if tmpl[i] == '%' && tmpl[i+1] == 'w' {
			return fmt.Errorf(tmpl, args...)
		}
	}
	return &Error{Code: code, msg: fmt.Sprintf(tmpl, args...)}
}

// Msg returns the English template text for code (no formatting).
func Msg(code Code) string {
	if s, ok := templates[code]; ok {
		return s
	}
	return string(code)
}

// CodeOf extracts Code from err when it is or wraps *Error.
func CodeOf(err error) (Code, bool) {
	var ae *Error
	if errors.As(err, &ae) && ae != nil && ae.Code != "" {
		return ae.Code, true
	}
	return "", false
}

// TimelineRead formats a per-user timeline failure (regex-friendly for the web parser).
func TimelineRead(user string, cause any) string {
	return fmt.Sprintf("Failed to read timeline for @%s: %v", user, cause)
}

// ArchiveLink formats a per-user archive-link failure.
func ArchiveLink(user string, cause any) string {
	return fmt.Sprintf("Failed to create archive link for @%s: %v", user, cause)
}

// MoreErrors is the trailer for truncated concatenated issue lists.
func MoreErrors(n int) string {
	return fmt.Sprintf("and %d more errors", n)
}

// MoreErrorKinds is the trailer when archiveIssueSummary truncates groups.
func MoreErrorKinds(n int) string {
	return fmt.Sprintf("and %d more error kinds", n)
}

// AggregateAccounts formats a backend pre-aggregated group line.
func AggregateAccounts(action, reason string, count int, targets string) string {
	if action != "" {
		return fmt.Sprintf("%s: %s (%d accounts: %s)", action, reason, count, targets)
	}
	return fmt.Sprintf("%s (%d accounts: %s)", reason, count, targets)
}

// AggregateTimes formats a backend pre-aggregated group without targets.
func AggregateTimes(action, reason string, count int) string {
	if action != "" {
		return fmt.Sprintf("%s: %s (%d times)", action, reason, count)
	}
	return fmt.Sprintf("%s (%d times)", reason, count)
}

// AggregateSingle formats a single grouped issue with one target.
func AggregateSingle(action, target, reason string) string {
	return fmt.Sprintf("%s (%s): %s", action, target, reason)
}
