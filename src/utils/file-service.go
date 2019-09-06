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
		return nil, err
	}

	for _, file := range files {
		scanFile(searchStart, file)
	}

	wg.Done()
	return files, nil
}

func scanFile(path string, file os.FileInfo) {
	if file.IsDir() {
		newDirFound(path, file)
	}
}

func newDirFound(path string, dir os.FileInfo) {
	dirName := dir.Name()
	if isDirExcluded(dirName) {
		return
	}
	if isNodeFolder(dirName) {
		fmt.Println(path + "/" + dirName)
	} else {
		wg.Add(1)
		go listDir(path + "/" + dirName)
	}
}

func isDirExcluded(path string) bool {
	if !haveIgnorePatter {
		return false
	}
	return ignoreFolderRegex.MatchString(path)
}

func isNodeFolder(name string) bool {
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
	wg.Add(1)
	mainPath := os.Args[1]
	targetFolder = os.Args[2]
	if len(os.Args) > 3 {
		prepareIgnoreRegex(os.Args[3])
	}

	go listDir(mainPath)
	wg.Wait()
}
