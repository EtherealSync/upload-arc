package main

import (
	"fmt"
	"os"
)

func main() {
	args := os.Args
	fmt.Println(args[1], args[2])
}
