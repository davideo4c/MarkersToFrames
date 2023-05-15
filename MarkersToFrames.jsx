/** ========== Markers to Frames ===========
    Creates a dockable ScriptUI panel that one-click renders markers in a composition.
    Uses a user-defined MarkerToFrame template in order to render a still for each marker.
    Optionally uses a user-defined MarkerRangeToFrames template in order to render the entire range of markers with range.
    Provides options for filtering by color, applying marker comments, using Layer Markers, and more!
    This is Markers to Frames version 0.3 -- Trans Rights are Human Rights Edition

    Credits
    Script by David Forsee
    BattleStyle, Apache 2.0, Copyright 2017 Adam Plouff
    Distributed with The Unlicense
**/

var ScriptName = "Markers To Frames";
var version = "0.2";
//var RenderMarkersIcon = ["0,44 38.125,44 38.125,30.25 19.175,17 0,30.25", "6.675,24.825 4.8,26 2.9,23.5 2.9,0 35.55,0 35.55,22.375 33.325,26 31.55,24.75 34.075,20.875 34.075,1.25 4.3,1.25 4.3,22", "4.3,1.25 9.8,1.25 9.8,6.75 4.3,6.75", "9.8,6.75 16.05,6.75 16.05,13 9.8,13", "22.3,6.75 28.55,6.75 28.55,13 22.3,13", "16.05,1.25 16.05,6.75 22.25,6.75 22.25,1.25", "28.55,0.5 34.8,0.5 34.8,6.75 28.55,6.75", "3.55,13 9.8,13 9.8,19.25 3.55,19.25", "28.55,13 34.8,13 34.8,19.25 28.55,19.25","28.55,22.65 23.525,19.25 28.55,19.25","9.8,22.5 15.05,19.25 9.8,19.25","16.05,13 22.3,13 22.3,18.25 19.125,16 16.05,18.25 16.05,13"];
var RenderMarkersIcon = ["18.29 16.81 18.27 8.31 18.27 0 12.08 0 9.46 10.23 6.83 0 0 0 0 16.81 4.25 16.81 4.25 3.99 7.52 16.81 11.37 16.81 14.65 3.99 14.65 16.81 18.29 16.81","35.08 3.61 35.08 0 22.01 0 25.78 8.31 21.95 16.81 27.45 16.81 27.45 9.94 33.97 9.94 33.97 6.55 27.45 6.55 27.45 3.61 35.08 3.61","19.2 12.15 19.2 5.11 22.49 5.11 23.9 8.63 22.49 12.15 19.2 12.15"]
var MarkerFrameWarning = "Please create an Output Module Template named \"MarkerToFrame\"\nCreate this dedicated Output Module in order to continue.\nThis can be found in Edit > Templates > Output Modules.\n Recommended Settings: PNG Sequence, Use Comp Frame Number, RGB+A, and Trillions of Colors.";
var MarkerRangeFrameWarning = "Please create an Output Module Template named \"MarkerRangeToFrames\"\nCreate this dedicated Output Module in order to continue.\nThis can be found in Edit > Templates > Output Modules.\nThis could be a PNG Sequence designed for frames or a video format in order to render only a segment of the composition.";

function hexToArray(hexString) {
    var hexColor = hexString.replace('#', '');
    var r = parseInt(hexColor.slice(0, 2), 16) / 255;
    var g = parseInt(hexColor.slice(2, 4), 16) / 255;
    var b = parseInt(hexColor.slice(4, 6), 16) / 255;
    return [r, g, b, 1];
}


/**** UI Scripting ***************************************************
    *************************************************************
    **************************************************************************/

    // Creating the dockable UI
    function createDockableUI(thisObj) {
        var dialog =
            thisObj instanceof Panel
                ? thisObj
                : new Window("window", undefined, undefined, { resizeable: true });
        dialog.onResizing = dialog.onResize = function() {
            this.layout.resize();
        };
        return dialog;
    }

    // Function to refresh and show displayed window
    function showWindow(myWindow) {
        if (myWindow instanceof Window) {
            myWindow.center();
            myWindow.show();
        }
        if (myWindow instanceof Panel) {
            myWindow.layout.layout(true);
            myWindow.layout.resize();
        }
    }

    // Instantiating the window
    var win = createDockableUI(this);
        win.text = ""; 
        win.orientation = "column"; 
        win.alignChildren = ["left","top"]; 
        win.spacing = 0; 
        win.margins = 5; 
    // Primary Group 1 Style Settings
    // ======
    var group1 = win.add("group", undefined, {name: "group1"}); 
        group1.orientation = "row"; 
        group1.alignChildren = ["fill","center"]; 
        group1.spacing = 10; 
        group1.margins = 5; 

    // BattleStyle Vector Button
    var vectorButton = buttonColorVector(group1,RenderMarkersIcon,[36,18],"#FF0099","#FFFFFF");
    //var vectorButton = group1.add("button",undefined,"Render Frames",{name:"vectorButton"});
       //vectorButton.helpTip = "Render Frames from either the selected comps in the Project Panel\nor composition in Viewer."
    // PRIMARY UI INTERACTION - THE 'HIT THE BUTTON' BUTTON
    vectorButton.onClick = function () {
        if (outputFolder == null) {
            outputFolder = Folder.selectDialog("Select a folder to save the output images.");
            if (outputFolder == null) {
                alert("Please select a valid output folder.");
                return;
            }
            selectedFolder.text = outputFolder.fsName;
            if (selectedFolder.text.length > maxLength) {
                selectedFolder.text = '...' + selectedFolder.text.slice(-maxLength);
            }
        }
        var comps = getSelectedCompositions();
        var previousQueue = storeQueue();
        for (var i = 0; i < comps.length; i++) {
            renderPNG(comps[i],outputFolder);
        }
        restoreQueue(previousQueue);
    }

    var divider1 = group1.add("panel", undefined, undefined, {name: "divider1"}); 
        divider1.alignment = "fill"; 
    var divider2 = win.add("panel", undefined, undefined, {name: "divider2"});
        divider2.alignment = "fill";

    // Directory Selection Choice
    var groupDirectoryChoice = group1.add("group",undefined,undefined,{name:"groupDirectoryChoice"});
        groupDirectoryChoice.alignment = "fill";
        groupDirectoryChoice.orientation = "column";
        groupDirectoryChoice.alignChildren = "center";
        groupDirectoryChoice.spacing=0;

    var directoryBtn = groupDirectoryChoice.add("button",undefined,"Choose Directory",{name:"directoryBtn"});
        directoryBtn.helpTip = "Choose output directory of your frames."
        directoryBtn.onClick = function () {
            outputFolder = Folder.selectDialog("Select an output folder");
            if (outputFolder) {
                selectedFolder.text = outputFolder.fsName;
            } else {
                selectedFolder.text = "Please select a folder.";
            }
            if (selectedFolder.text.length > maxLength) {
                selectedFolder.text = '...' + selectedFolder.text.slice(-maxLength);
            }
        }
    var selectedFolder = groupDirectoryChoice.add("statictext",undefined,"",{name:"selectedFolder"});
        var maxLength = 20;
        selectedFolder.alignment = "fill";
        //selectedFolder.enabled = false;
        if (outputFolder != null) {
            selectedFolder.text = outputFolder.fsName;
        if (selectedFolder.text.length > maxLength) {
            selectedFolder.text = '...' + selectedFolder.text.slice(-maxLength);
        }
        }

    var projectFile = app.project.file;
    if (projectFile != null) {
        var outputFolder = projectFile.parent;
            selectedFolder.text = outputFolder.fsName;
        if (selectedFolder.text.length > maxLength) {
            selectedFolder.text = '...' + selectedFolder.text.slice(-maxLength);
        }
    } else {
        outputFolder = null;
    }

    // SETTINGSGROUP
    // =============
    var settingsGroup = win.add("group", undefined, {name: "settingsGroup"}); 
        settingsGroup.orientation = "column"; 
        settingsGroup.alignChildren = ["left","center"]; 
        settingsGroup.spacing = 0; 
        settingsGroup.margins = 0;

    var statictext1 = settingsGroup.add("statictext", undefined, undefined, {name: "statictext1"}); 
        statictext1.text = "Settings"; 
        statictext1.justify = "center"; 
        statictext1.alignment = ["center","center"]; 

    var useMarkerName = settingsGroup.add("checkbox", undefined, undefined, {name: "useMarkerName"}); 
        useMarkerName.helpTip = "Include marker's Comment in\nthe output file name."; 
        useMarkerName.text = "Include Marker Names"; 

    var useColorMarker = settingsGroup.add("checkbox", undefined, undefined, {name: "useColorMarker"}); 
        useColorMarker.helpTip = "Only render colored markers."; 
        useColorMarker.text = "Only Color Markers";
    var useLayerMarkers = settingsGroup.add("checkbox",undefined,undefined,{name:"useLayerMarkers"});
        useLayerMarkers.helpTip = "Use Layer Markers along with Composition Markers.";
        useLayerMarkers.text = "Use Layer Markers";
        useLayerMarkers.value = true;
    var useVersions = settingsGroup.add("checkbox",undefined,undefined,{name:"useVersions"});
        useVersions.helpTip = "Version up your frames with a _frameV#.";
        useVersions.text = "Use Versioning";
    var useMarkerRange = settingsGroup.add("checkbox", undefined,undefined,{name:"useMarkerRange"});
        useMarkerRange.helpTip = "If markers have a duration, render everyone of their frames.\nProvides option to use a MarkerRangeToFrames output module."
        useMarkerRange.text = "Render Each Marker's Range"
    var insertMROM = settingsGroup.add("group",undefined,undefined,{name:"insertMROM"});
        insertMROM.orientation = "row";
        insertMROM.alignChildren = "left";
        insertMROM.spacing = 0;
        insertMROM.margins = 0;
    var useMarkerRangeOutputModule = insertMROM.add("checkbox", undefined, "Seperate Output for Ranges");
        useMarkerRangeOutputModule.helpTip = "Use a seperate output module named MarkerRangeToFrames for rendering markers with a range only.\nUseful for rendering multiple segments of video in combination with stills."
        useMarkerRangeOutputModule.enabled = false;
        useMarkerRangeOutputModule.visible = false;


    // Add an event listener to the "Use Marker Range" checkbox
    useMarkerRange.onClick = function() {
    // If the checkbox is checked
    if (this.value) {
        // Enable and make visible the "Use Marker Range Output Module" checkbox
        insertMROM.enabled = true;
        insertMROM.visible = true;
        useMarkerRangeOutputModule.enabled = true;
        useMarkerRangeOutputModule.visible = true;
    } else {
        // If the checkbox is unchecked, disable and make invisible the "Use Marker Range Output Module" checkbox
        insertMROM.enabled = false;
        insertMROM.visible = false;
        useMarkerRangeOutputModule.enabled = false;
        useMarkerRangeOutputModule.visible = false;
    }
    };

/**** Vector Icon Drawing ********************************************
	 * Vector Button **********************************************************
	 **************************************************************************/
	function vecToPoints(vecCoord) {
		var points = [];
		var n;
		for (var i = 0; i < vecCoord.length; i++) {
			var eachNum = vecCoord[i].split(/[\s,]/);
			var coordinates = [];
			var sets = [];
			for (var k = 0; k < eachNum.length; k += 2) {
				sets.push(eachNum[k] + "," + eachNum[k + 1]);
			}
			for (var j = 0; j < sets.length; j++) {
				n = sets[j].split(",");
				coordinates[j] = n;
				coordinates[j][0] = (parseFloat(coordinates[j][0]));
				coordinates[j][1] = (parseFloat(coordinates[j][1]));
			}
			points.push(coordinates);
		}
		return points;
	}

	function vecDraw() {
		this.graphics.drawOSControl();
		this.graphics.rectPath(0, 0, this.size[0], this.size[1]);
		this.graphics.fillPath(this.graphics.newBrush(this.graphics.BrushType.SOLID_COLOR, [0, 0, 0, 0.15]));
		try {
			for (var i = 0; i < this.coord.length; i++) {
				var line = this.coord[i];
				this.graphics.newPath();
				this.graphics.moveTo(line[0][0] + (this.size[0] / 2 - this.artSize[0] / 2), line[0][1] + (this.size[1] / 2 - this.artSize[1] / 2));
				for (var j = 0; j < line.length; j++) {
					this.graphics.lineTo(line[j][0] + (this.size[0] / 2 - this.artSize[0] / 2), line[j][1] + (this.size[1] / 2 - this.artSize[1] / 2));
				}
				this.graphics.fillPath(this.graphics.newBrush(this.graphics.BrushType.SOLID_COLOR, hexToArray(this.iconColor)));
			}
		} catch (e) {

		}
	}

	/** draw an colored icon button - returns a button object
		@parem {parentObj} - object - ScriptUI panel or group
		@parem {iconVec} - array of strings - SVG coords as string
        @parem {size} - array - icon size
		@parem {staticColor} - string - icon color when static
		@parem {hoverColor} - string - icon color when hovered (optional)
	*/
	function buttonColorVector(parentObj, iconVec, size, staticColor, hoverColor) {
		var btn = parentObj.add("button", [0, 0, size[0], size[1], undefined]);
			btn.coord = vecToPoints(iconVec);
			btn.iconColor = staticColor;
			btn.artSize = size;
			btn.onDraw = vecDraw;

        if (hoverColor) {
    		try {
    			btn.addEventListener("mouseover", function() {
    				updateVectorButtonOnHover(this, iconVec, hoverColor, size);
    			});
    			btn.addEventListener("mouseout", function() {
    				updateVectorButtonOnHover(this, iconVec, staticColor, size);
    			});
    		}
    		catch(err) {
    			// fail silently
    		}
        }

		return btn;
	}

	function updateVectorButtonOnHover(btn, iconVec, iconColor, size) {
		btn.coord = vecToPoints(iconVec);
		btn.iconColor = iconColor;
		btn.artSize = size;
		btn.onDraw = vecDraw;
		return btn;
	}

 showWindow(win);

/**** renderPNG(); ***************************************************
    * Main Function, Rendering PNGS ******************************************
    **************************************************************************/

    function renderPNG(renderComp,outputFolder) {
        // Get the current composition
        var activeComp = renderComp;
        if (!(activeComp instanceof CompItem)) {
            alert("Trying to pull markers from a non-composition...but I thought it was???");
            return;
        }
        // Loop through all markers in the composition and render a PNG at each marker
        //var markers = activeComp.markerProperty;
        var markers = [];
        var markerTimes = [];
        var markerLayer = [];
        var compMarkers = activeComp.markerProperty;
        for (var i = 1; i <= compMarkers.numKeys; i++) {
            markers.push(compMarkers.keyValue(i));
            markerTimes.push(compMarkers.keyTime(i));
            markerLayer.push(0);
        }
        if (useLayerMarkers.value) {
            for (var j = 1; j <= activeComp.numLayers; j++) {
                var layerMarkers = activeComp.layer(j).marker;
                for (var k = 1; k <=layerMarkers.numKeys; k++) {
                    markers.push(layerMarkers.keyValue(k));
                    markerTimes.push(layerMarkers.keyTime(k));
                    markerLayer.push(activeComp.layer(j).name);
                }
            }
        }

        var numRenderedMarkers = 0;

        for (var i = 0; i < markers.length; i++) {
            // Get information about marker
            var m = markers[i];
            var markerTime = markerTimes[i];

            // If using Color Markers only and the marker does not have a label, skip to next marker.
            if (useColorMarker.value && m.label == 0) {
                continue;
            }

            //Base File Name Construction 
            var baseFileName = activeComp.name + "_";
            if (useLayerMarkers.value && (markerLayer[i] != 0) && (markerLayer[i] != null)) {
                baseFileName = baseFileName + markerLayer[i] + "_";
            }
            if (useMarkerName.value && (m.comment !=null)) {
                baseFileName = baseFileName + m.comment + "_";
            }
            baseFileName = baseFileName + i;
            // Create full output filePath 
            if (useVersions.value) {
                var outputPath = getOutputFileVersion(outputFolder, baseFileName);
            } else {
                var outputPath = outputFolder.fsName + "/" + baseFileName + "_[#####]";
            }


            // Set timing for the render queue item based off marker time.
            activeComp.time = markerTime;
            var newRenderQueueItem = app.project.renderQueue.items.add(activeComp);
            var outputModule = newRenderQueueItem.outputModule(1);
            // Get the current state of the checkboxes
            var useMarkerRangeValue = useMarkerRange.value;
            var useMarkerRangeOutputModuleValue = useMarkerRangeOutputModule.value;
            var markerDuration = m.duration;

            // Use a switch statement to assign Output Modules based on Marker Range and if using a seperate Marker Range Output
            switch (true) {
                case !useMarkerRangeValue || markerDuration === 0:
                    try {
                        outputModule.applyTemplate("MarkerToFrame");
                    } catch (error) {
                        alert(MarkerFrameWarning);
                        newRenderQueueItem.remove();
                        return;
                    }
                    outputModule.file = File(outputPath);
                    newRenderQueueItem.timeSpanStart = markerTime;
                    newRenderQueueItem.timeSpanDuration = activeComp.frameDuration;
                    break;
                case useMarkerRangeOutputModuleValue:
                    try {
                        outputModule.applyTemplate("MarkerRangeToFrames");
                    } catch (error) {
                        alert(MarkerRangeFrameWarning);
                        newRenderQueueItem.remove();
                        return;
                    }
                    outputModule.file = File(outputPath);
                    newRenderQueueItem.timeSpanStart = markerTime;
                    newRenderQueueItem.timeSpanDuration = m.duration;
                    break;
                case useMarkerRangeValue && !useMarkerRangeOutputModuleValue:
                    try {
                        outputModule.applyTemplate("MarkerToFrame");
                    } catch (error) {
                        alert(MarkerFrameWarning);
                        newRenderQueueItem.remove();
                        return;
                    }
                    outputModule.file = File(outputPath);
                    newRenderQueueItem.timeSpanStart = markerTime;
                    newRenderQueueItem.timeSpanDuration = m.duration;
                    break;
                default:
                    alert("There has been an error in the logic deciding between using Marker Range Values or not.");
                    break;
                }
            numRenderedMarkers += 1;
        } // End loop through markers
        var useAME = true;
        // Check if any markers are set to render.
        if (app.project.renderQueue.canQueueInAME) {    
            // Suppress overwriting file dialogues and render the renderQueue.
            app.beginSuppressDialogs();
            app.project.renderQueue.render();
            app.endSuppressDialogs(false);

            // Clean up the generated markers from the render queue.
            for (var i = 1; i<=numRenderedMarkers; i++) {
                var numRenderItems = app.project.renderQueue.numItems;
                app.project.renderQueue.item(numRenderItems).remove();
            }
        }
    }

function getOutputFileVersion(oF, bFN) { // This function retrieves the lastest file version
    var outputFolderFiles = oF.getFiles();
    var latestVersion = 0;
    var latestFile = "";
    if  (outputFolderFiles.length != 0) {
        for (var i = 0; i < outputFolderFiles.length; i++) {
            var fileName = outputFolderFiles[i].displayName;
            if (fileName.indexOf(bFN) != -1) {
                var versionMatch = fileName.match(/frameV(\d+)/);
                if (versionMatch) {
                    var version = parseInt(versionMatch[1]);
                    if (!isNaN(version) && version > latestVersion) {
                        latestVersion = version;
                        latestFile = outputFolderFiles[i];
                    }
                }
            }
        }
        latestVersion += 1;
        var outputFileVersion = oF.fsName + "/" + bFN + "_[#####]" + "_frameV" + latestVersion;
        //var outputFileVersion = oF.fsName + "/" + bFN + "_frameV" + latestVersion + "_[#####].png";
    } else {
        var outputFileVersion = oF.fsName + "/" + bFN + "_[#####]_frameV1";
        //var outputFileVersion = oF.fsName + "/" + bFN + "_frameV1_[#####].png";
    }
    return outputFileVersion;

}

function getSelectedCompositions() { // Flexible selection of the compositions the project panel or a currently active comp.
  var selectedCompositions = [];
  var activeComposition = null;
  var activeViewer = app.activeViewer;

  // Get the selected items in the Project Panel
  var selectedItems = app.project.selection;
  if (selectedItems.length > 0) {
    for (var i = 0; i < selectedItems.length; i++) {
      if (selectedItems[i] instanceof CompItem) {
        selectedCompositions.push(selectedItems[i]);
      }
    }
  }

  // If no compositions are selected, get the active Composition
  if (selectedCompositions.length == 0) {
    if (activeViewer != null && activeViewer.typeName === "viewer" && activeViewer.options.active) {
      activeComposition = activeViewer.options.active[0];
    } else if (app.project.activeItem != null && app.project.activeItem instanceof CompItem) {
      activeComposition = app.project.activeItem;
    }

    if (activeComposition != null) {
      selectedCompositions.push(activeComposition);
    } else {
      // Try setting the activeItem to an open composition and get its markers
      var openComps = [];
      for (var i = 1; i <= app.project.numItems; i++) {
        if (app.project.item(i) instanceof CompItem && app.project.item(i).duration > 0) {
          openComps.push(app.project.item(i));
        }
      }

      if (openComps.length > 0) {
        app.project.activeItem = openComps[0];
        activeComposition = app.project.activeItem;
        selectedCompositions.push(activeComposition);
      } else {
        alert("No open compositions found!");
      }
    }
  }

  return selectedCompositions;
}

function storeQueue() {     // Disables all currently enabled render queue items, and returns an array of RQItems that were enabled.
    // Get the current render queue
    var renderQueue = app.project.renderQueue;

    // Create an array to store the enabled items
    var enabledItems = [];

    // Loop through all the items in the render queue
    for (var i = 1; i <= renderQueue.numItems; i++) {
        var item = renderQueue.item(i);

        // Check if the item is enabled
        if (item.status == RQItemStatus.QUEUED || item.status == RQItemStatus.RENDERING) {
            // Add the item to the enabledItems array
            enabledItems.push(item);

            // Disable the item
            item.render = false;
        } 
    }
    //alert(enabledItems.length + " items enabled: " + enabledItems.join(", "));  
    return enabledItems;
}

function restoreQueue(queue) {     // Enable all render queue items, takes an array of RQItems.
    for (var i = 0; i < queue.length; i++) {
        queue[i].render = true;
    }
}