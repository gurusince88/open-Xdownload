package apperr

import "fmt"

// Progress / status / title strings persisted on jobs (English for new writes).
const (
	MsgQueued                = "Queued"
	MsgCanceled              = "Canceled"
	MsgJobFailed             = "Job failed"
	MsgDownloadComplete      = "Download complete"
	MsgDownloadingMedia      = "Downloading media"
	MsgMediaSkippedPermanent = "Media permanently unavailable; skipped"
	MsgRetryingFailedTweets  = "Retrying failed tweets"
	MsgFetchingListMembers   = "Fetching list members"
	MsgFetchingFollowing     = "Fetching following users"
	MsgJobKindMigrating      = "This job type is still being migrated"
	MsgLinkNoMediaURL        = "Link recognized, but no media URL was resolved"
	MsgFailedTweetRetryTitle = "Failed tweet retry"
	MsgMediaURLTitle         = "Media URL"
	MsgUserLabel             = "User"
)

func MsgDownloadingProgress(index, total int) string {
	return fmt.Sprintf("Downloading %d/%d", index, total)
}

func MsgDownloadCompleteSkipped(n int) string {
	return fmt.Sprintf("Download complete: %d permanently unavailable, skipped", n)
}

func MsgFailedTweetRetryDone(ok, remaining int) string {
	return fmt.Sprintf("Failed tweet retry complete: %d succeeded, %d remaining", ok, remaining)
}

func MsgUsersSynced(done, total int) string {
	return fmt.Sprintf("Synced users %d/%d", done, total)
}

func MsgSyncingUser(order, total int, user string) string {
	return fmt.Sprintf("Syncing user %d/%d @%s", order, total, user)
}

func MsgDownloadingUserMedia(user string) string {
	return fmt.Sprintf("Downloading media for @%s", user)
}

func MsgJobTitleUser(input string) string {
	return fmt.Sprintf("User %s", input)
}

func MsgJobTitleList(input string) string {
	return fmt.Sprintf("List %s", input)
}

func MsgJobTitleFollowing(input string) string {
	return fmt.Sprintf("Following %s", input)
}

func MsgArchiveComplete(users, tweets, downloaded, skipped, failed, retried int) string {
	parts := []string{
		fmt.Sprintf("users %d", users),
		fmt.Sprintf("tweets %d", tweets),
		fmt.Sprintf("downloaded %d", downloaded),
	}
	if skipped > 0 {
		parts = append(parts, fmt.Sprintf("skipped %d", skipped))
	}
	if failed > 0 {
		parts = append(parts, fmt.Sprintf("failed %d", failed))
	}
	if retried > 0 {
		parts = append(parts, fmt.Sprintf("retry ok %d", retried))
	}
	out := "Archive complete: "
	for i, p := range parts {
		if i > 0 {
			out += ", "
		}
		out += p
	}
	return out
}

func MsgAPIRequestFailed(status int, payload string) string {
	if payload == "" {
		return fmt.Sprintf("X API request failed: HTTP %d", status)
	}
	return fmt.Sprintf("X API request failed: HTTP %d %s", status, payload)
}

func MsgUserUnavailableTyped(typeName string) string {
	return fmt.Sprintf("User unavailable: %s", typeName)
}
