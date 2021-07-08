#
# converter
#

fname = 'file_list.txt'
with open(fname) as f:
  content = f.readlines()
# remove whitespace characters like `\n` at the end of each line
content = [x.rstrip('\n') for x in content] 
numFiles = len(content)

print('num files = ' + str(numFiles) )
print('create out put js...')

strLines = []
for i in range(0, numFiles):
  strNew = '    \'' + content[i] + '\',';
  strLines.append(strNew)

outFileName = 'list.js'
with open(outFileName, 'w') as f:
  for strLine in strLines:
    f.write("%s\n" % strLine)

print('see ' + outFileName + ' file...')