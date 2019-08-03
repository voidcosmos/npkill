package main

import (
	"fmt"
	"io/ioutil"
	"os"
)

func listDir(searchStart string) ([]os.FileInfo, error) {
	files, err := ioutil.ReadDir(searchStart)
	if err != nil {
		return nil, err
	}

	for _, file := range files {
		scanFile(searchStart, file)
	}

	return files, nil
}

func scanFile(path string, file os.FileInfo) {
	if file.IsDir() {
		newDirFound(path, file)
	}
}

func newDirFound(path string, dir os.FileInfo) {
	dirName := dir.Name()
	if isNodeFolder(dirName) {
		fmt.Println(path + "/" + dirName)
	} else {
		listDir(path + "/" + dirName)
	}
}

func isNodeFolder(name string) bool {
	return name == "node_modules"
}

func main() {
	listDir(os.Args[1])
}
