package main

import (
	"fmt"
	"os"
	"io/ioutil"
)


func listDir(searchStart string) ([]os.FileInfo, error) {
	files, err := ioutil.ReadDir(searchStart)
	if err != nil {
	}

	for _, file := range files {
		if file.IsDir() {
			if err == nil && file.Name() == "node_modules" {
				fmt.Println(searchStart + "/"+ file.Name())
			}else{
				listDir(searchStart + "/"+ file.Name())
			}
		}
	}

	return files, nil
}


func main() {
	listDir(os.Args[1])
}