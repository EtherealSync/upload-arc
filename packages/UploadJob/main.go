package main

import (
	"encoding/json"
	"fmt"
	"os"
	"time"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/googleapi"
	"google.golang.org/api/youtube/v3"
)

func main() {

	payloadJSON := os.Getenv("SST_PAYLOAD")

	var payload map[string]interface{}
	err := json.Unmarshal([]byte(payloadJSON), &payload)
	if err != nil {
		panic(err)
	}

	//hard value don't change
	clientID := "709434665374-00jrcb0vudjv4bhc0nprrv5hdf0j2ehs.apps.googleusercontent.com"
	clientSecret := "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"

	accessToken := ""  // from dynamo db query
	refreshToken := "" //from dynamo db query

	config := oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		Endpoint:     google.Endpoint,
		RedirectURL:  "urn:ietf:wg:oauth:2.0:oob",
	}

	token := &oauth2.Token{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		Expiry:       time.Now(),
	}

	client := config.Client(oauth2.NoContext, token)

	youtubeService, err := youtube.New(client)
	if err != nil {
		fmt.Println("Error creating YouTubwe service client:", err)
		return
	}

	video := &youtube.Video{
		Snippet: &youtube.VideoSnippet{
			Title:       "Test Uplaod",
			Description: "Test Description",
		},
		Status: &youtube.VideoStatus{PrivacyStatus: "private"},
	}

	videoPath := "test-video.mov" // s3 object

	file, err := os.Open(videoPath)
	if err != nil {
		fmt.Println("Error opening video file:", err)
		return
	}
	defer file.Close()

	fmt.Println("Starting video upload")

	insertRequest := youtubeService.Videos.Insert([]string{"snippet", "status"}, video)

	response, err := insertRequest.Media(file, googleapi.ContentType("video/*")).Do()
	if err != nil {
		fmt.Println("Error uploading video:", err)
		return
	}

	fmt.Printf("Video uploaded! Video ID: %s\n", response.Id)

}
