package main

import (
	"fmt"
	"os"
)

func main() {

	fmt.Println("Job Invoked")

	sstPayload := os.Getenv("SST_PAYLOAD")

	if sstPayload != "" {
		fmt.Println(sstPayload)
	} else {
		fmt.Println("doesn't exsist")
	}
}
