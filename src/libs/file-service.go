// Custom alternative to the linux find command
package main

import (
	"fmt"
	"io/ioutil"
	"os"
	"regexp"
	"strings"
	"sync"
)

var wg sync.WaitGroup
var targetFolder string
var ignoreFolderRegex *regexp.Regexp
var haveIgnorePatter = false

func listDir(searchStart string) ([]os.FileInfo, error) {
	files, err := ioutil.ReadDir(searchStart)
	if err != nil {
		wg.Done()
		return nil, err
	}

	for _, file := range files {
		scanFile(searchStart, file)
	}

	wg.Done()
	return files, nil
}

func scanFile(path string, file os.FileInfo) {
	fileName := file.Name()

	if isFileExcluded(fileName) {
		return
	}

	if isTargetFile(fileName) {
		fmt.Println(path + "/" + fileName)
	}

	if file.IsDir() {
		wg.Add(1)
		go listDir(path + "/" + fileName)
	}
}

func isFileExcluded(path string) bool {
	if !haveIgnorePatter {
		return false
	}
	return ignoreFolderRegex.MatchString(path)
}

func isTargetFile(name string) bool {
	return name == targetFolder
}

func prepareIgnoreRegex(words string) {
	wodsList := strings.Replace(words, " ", "|", -1)
	compiledRegex, compileError := regexp.Compile("\\A" + wodsList + "\\z")

	if compileError == nil {
		ignoreFolderRegex = compiledRegex
		haveIgnorePatter = true
	}
}

func main() {
	mainPath := os.Args[1]
	targetFolder = os.Args[2]
	if len(os.Args) > 3 {
		prepareIgnoreRegex(os.Args[3])
	}

	wg.Add(1)
	go listDir(mainPath)
	wg.Wait()
}
