import * as assert from 'assert'
import { isFileTypeExcluded, isFolderNameExcluded } from '../validation'

suite('Filesystem Validation Tests', () => {
  suite('isFileTypeExcluded', () => {
    test('should return true for excluded file types', () => {
      const excludedFileTypes = ['.exe', '.bin', '.dll']

      assert.strictEqual(isFileTypeExcluded('app.exe', excludedFileTypes), true)
      assert.strictEqual(isFileTypeExcluded('library.dll', excludedFileTypes), true)
      assert.strictEqual(isFileTypeExcluded('data.bin', excludedFileTypes), true)
    })

    test('should return false for non-excluded file types', () => {
      const excludedFileTypes = ['.exe', '.bin', '.dll']

      assert.strictEqual(isFileTypeExcluded('script.js', excludedFileTypes), false)
      assert.strictEqual(isFileTypeExcluded('styles.css', excludedFileTypes), false)
      assert.strictEqual(isFileTypeExcluded('doc.md', excludedFileTypes), false)
    })

    test('should handle files without extensions', () => {
      const excludedFileTypes = ['.exe', '.bin', '.dll']

      assert.strictEqual(isFileTypeExcluded('README', excludedFileTypes), false)
      assert.strictEqual(isFileTypeExcluded('LICENSE', excludedFileTypes), false)
    })

    test('should work with empty excluded list', () => {
      assert.strictEqual(isFileTypeExcluded('script.js', []), false)
      assert.strictEqual(isFileTypeExcluded('app.exe', []), false)
    })
  })

  suite('isFolderNameExcluded', () => {
    test('should return true for excluded folder names', () => {
      const excludedFolders = ['node_modules', '.git', 'dist']

      assert.strictEqual(isFolderNameExcluded('node_modules', excludedFolders), true)
      assert.strictEqual(isFolderNameExcluded('.git', excludedFolders), true)
      assert.strictEqual(isFolderNameExcluded('dist', excludedFolders), true)
    })

    test('should return false for non-excluded folder names', () => {
      const excludedFolders = ['node_modules', '.git', 'dist']

      assert.strictEqual(isFolderNameExcluded('src', excludedFolders), false)
      assert.strictEqual(isFolderNameExcluded('app', excludedFolders), false)
      assert.strictEqual(isFolderNameExcluded('components', excludedFolders), false)
    })

    test('should work with empty excluded list', () => {
      assert.strictEqual(isFolderNameExcluded('node_modules', []), false)
      assert.strictEqual(isFolderNameExcluded('src', []), false)
    })

    test('should perform exact matches only', () => {
      const excludedFolders = ['node_modules', '.git', 'dist']

      assert.strictEqual(isFolderNameExcluded('node_modules_old', excludedFolders), false)
      assert.strictEqual(isFolderNameExcluded('old_dist', excludedFolders), false)
    })
  })
})
