# Coalescer
Coalescer is a plugin for [Obsidian](https://obsidian.md). Coalescer allows you to easily merge files, links, and tags with each other to better organize your vault.

## How does it work?
Coalescer will automatically sort similar items at the top of the list as you make selections.
The first item you select determines what action is taken on all following selections. When you've made all your selections, **right-click** anywhere in the list view to exceute.


## Features
- **File Merging**
![](https://github.com/geoffreysflaminglasersword/Coalescer/blob/master/resources/FileMergeWithLink%2BTagUpdate.gif)
When you select a file first, followed by any number of tags, links, or files, all files will get merged into the first selection, and all links/tags will be updated as references to the file.

- **Coalescing with Aliases**
![](https://github.com/geoffreysflaminglasersword/Coalescer/blob/master/resources/CoalescingWithAliases.gif)
When selecting a file first, you also have the option to Coalesce to Aliases, meaning any unresolved links or files will become aliases in the final merged file

- **Updating Metadata With Tags**
![](https://github.com/geoffreysflaminglasersword/Coalescer/blob/master/resources/UpdateMetaDataWithTag.gif)
If you first select a tag, followed by any number of items, any file selections will have that tag added to their metadata

- **Filters**
![](https://github.com/geoffreysflaminglasersword/Coalescer/blob/master/resources/FilteringAndCombiningFiles.gif)
There's two ways of filtering. You can use the controls in the Coalescer view to filter items, or you can use regex in the plugin settings to tell Coalescer to ignore files, directories, and tags.


