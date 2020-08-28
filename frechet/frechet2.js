function debug(str) {
    console.log(str);
}



window.progress1 = 0;
window.progress2 = 0;

window.markX = 0;
window.markY = 0;
window.marking = false;

function setPixel(imageData, x, y, r, g, b, a) {
    index = (x + y * imageData.width) * 4;
    imageData.data[index + 0] = r;
    imageData.data[index + 1] = g;
    imageData.data[index + 2] = b;
    imageData.data[index + 3] = a;
}

function getX(e,boundingRect,index) {
    e.offsetX = e.touches[index].clientX - boundingRect.left;
    var mX = e.offsetX
    if (mX < 0) mX = 0;
    if (mX > boundingRect.right - boundingRect.left) mX = boundingRect.right - boundingRect.left;
    return mX;
}
function getY(e, boundingRect,index) {
    e.offsetY = e.touches[index].clientY - boundingRect.top;
    var mY = e.offsetY;
    if (mY < 0) mY = 0;
    if (mY > boundingRect.bottom - boundingRect.top) mY = boundingRect.bottom - boundingRect.top;
    return mY;
}


function drawCells() {
    for (i = 1; i < gps.length-1; ++i) {
        diagramContext.beginPath();
        diagramContext.strokeStyle = '#FBB';
        diagramContext.lineWidth = 2;
        diagramContext.moveTo(gps[i].distFromStart/trackLength*dW,0);
        diagramContext.lineTo(gps[i].distFromStart/trackLength*dW,dH);
        diagramContext.stroke();
    }
    for (i = 1; i < gps2.length-1; ++i) {
        diagramContext.beginPath();
        diagramContext.strokeStyle = '#BBF';
        diagramContext.lineWidth = 2;
        diagramContext.moveTo( 0,gps2[i].distFromStart/trackLength2*dH);
        diagramContext.lineTo(dW,gps2[i].distFromStart/trackLength2*dH);
        diagramContext.stroke();
    }
}

function diagramMouseMove(e) {
    e.preventDefault();
    e.stopPropagation();
    var mX, mY;
    if (e.touches && e.touches.length > 0) {
        var boundingRect = diagram.getBoundingClientRect();
        mX = getX(e, boundingRect, 0);
        mY = getY(e, boundingRect, 0);
    } else {
        mX = e.offsetX;
        mY = e.offsetY;
    }
    progress1 = trackLength * mX / dW;
    progress2 = trackLength2 * mY / dH;
    progressMid = 0.5 * (progress1 + progress2);
    tc.clearRect(0, 0, tW, tH);
    var p1 = pointFromProgress(progress1);
    var p2 = pointFromProgress2(progress2);
    if (distanceMap[mY * dW + mX] < epsilon) {
        if( showMark1 ) drawLeashDisc(p1.x, p1.y, true);
        if (validMap[mY * dW + mX] == 1) {
            showInterval = 'red';
            if (!showMark1 || !showMark2) showInterval = false;
            drawTrajectory(showInterval);
        } else {
            showInterval = 'blue';
            if (!showMark1 || !showMark2) showInterval = false;
            drawTrajectory(showInterval);
        }
    } else {
        if( showMark1 ) drawLeashDisc(p1.x, p1.y, false);
        showInterval = 'black';
        if (!showMark1 || !showMark2) showInterval = false;
        drawTrajectory(showInterval);
    }
    if( showMark1 ) drawMark(p1, 'red');
    if (showMark2) drawMark(p2, '#0F0');
    if (showMark1 && showMark2) {
        var pMid = pointFromProgress(progressMid);
        var factor = 1.12*0.35355;
        if (dist(p1.x, p1.y, pMid.x, pMid.y) > factor * epsilon && dist(p2.x, p2.y, pMid.x, pMid.y) > factor * epsilon && validMap[mY * dW + mX]) {
            
            drawMark(pMid, 'yellow');
        }
    }
    if (diagramInteraction && e.which != 0) {
        epsilon = distanceMap[mY * dW + mX];
        updateDiagram();
    }

	if (showDiagramX || showDiagramY || showDiagramDiagonal) {
        diagramContext.putImageData(imageData, 0, 0);
        drawCells();
        drawDiagramDiagonal();
        if (showDiagramX) {
        	diagramContext.beginPath();
            diagramContext.strokeStyle = 'red';
            diagramContext.lineWidth = 1;
            diagramContext.moveTo(mX, 0);
            diagramContext.lineTo(mX, dH);
            diagramContext.stroke();
            pct = 100 * mX / dW;
			diagramContext.fillStyle = 'red';
			diagramContext.fillText(""+pct.toFixed(0)+"%", mX-100, mY-50);
        }
        if (showDiagramY) {
            diagramContext.beginPath();
            diagramContext.strokeStyle = '#0F0';
            diagramContext.lineWidth = 1;
            diagramContext.moveTo(0, mY);
            diagramContext.lineTo(dW, mY);
            diagramContext.stroke();
			pct = 100 * mY / dH;
			diagramContext.fillStyle = 'blue';
			diagramContext.fillText(""+pct.toFixed(0) +"%", mX-100, mY-100);
        }
	}

}
function diagramMouseUp(e) {
    e.preventDefault();
    updateValid();
}


function trajectoryMouseMove(e) {
    debug("tmm");
    e.stopPropagation();
    e.preventDefault();
    var boundingRect = trajectory.getBoundingClientRect();
    var mX = e.offsetX;
    var mY = e.offsetY;
    tc.clearRect(0, 0, tW, tH);
    if (marking) {
        epsilon = dist(markX, markY, mX, mY);
        drawLeashDisc(markX, markY);
        updateDiagram();
    } else {
        drawLeashDisc(mX, mY);
    } 
    drawTrajectory();
}
function trajectoryTouchMove(e) {
    e.stopPropagation();
    e.preventDefault();
    var boundingRect = trajectory.getBoundingClientRect();
    if (e.touches.length == 2) {
        var x0 = getX(e, boundingRect, 0);
        var y0 = getY(e, boundingRect, 0);
        var x1 = getX(e, boundingRect, 1);
        var y1 = getY(e, boundingRect, 1);
        markX = 0.5 * (x0 + x1);
        markY = 0.5 * (y0 + y1);
        epsilon = 0.5 * dist(x0, y0, x1, y1);
        tc.clearRect(0, 0, tW, tH);
        drawLeashDisc(markX, markY);
        updateDiagram();
    } else {
        var mX = getX(e, boundingRect, 0);
        var mY = getY(e, boundingRect, 0);
        tc.clearRect(0, 0, tW, tH);
        if (marking) {
            epsilon = dist(markX, markY, mX, mY);
            drawLeashDisc(markX, markY);
            updateDiagram();
        } else {
            drawLeashDisc(mX, mY);
        }
    }
    drawTrajectory();
}
function trajectoryMouseDown(e) {
    debug("start");
    e.preventDefault();
    e.stopPropagation();
    marking = true;
    var boundingRect = trajectory.getBoundingClientRect();
    var mX = e.offsetX;
    var mY = e.offsetY;
    markX = mX;
    markY = mY
    updateDiagram();
}
function trajectoryTouchDown(e) {
    debug("start");
    e.preventDefault();
    e.stopPropagation();
    marking = true;
    var boundingRect = trajectory.getBoundingClientRect();
    var mX = getX(e, boundingRect, 0);
    var mY = getY(e, boundingRect, 0);
    markX = mX;
    markY = mY
    updateDiagram();
}
function trajectoryMouseUp(e) {
    debug("end");
    e.preventDefault();
    e.stopPropagation();
    if (e.touches && e.touches.length > 0) return;
    marking = false;
    updateDiagram();
    updateValid();
}


function drawDiagramDiagonal() { 
	if(showDiagramDiagonal) {
		diagramContext.beginPath();
		diagramContext.strokeStyle = 'black';
		diagramContext.lineWidth = 1;
		diagramContext.moveTo(0, 0);
		diagramContext.lineTo(dW, dH);
		diagramContext.stroke();
	}
}

function drawTrajectory(showInterval) {
    if(showAsInterval==false) showInterval = false;
    tc.beginPath();
    tc.strokeStyle = '#C80000';
    tc.lineWidth = 3;
    tc.moveTo(gps[0].x, gps[0].y);
    for (i = 1; i < gps.length; ++i) {
        tc.lineTo(gps[i].x, gps[i].y);
    }
    tc.stroke();
    if (showInterval) {
        var pro1 = Math.min(progress1, progress2);
        var pro2 = Math.max(progress1, progress2);
        tc.beginPath();
        tc.strokeStyle = showInterval;
        tc.lineWidth = 4;
        var startP = pointFromProgress(pro1);
        tc.moveTo(startP.x, startP.y);
        for (i = 1; i < gps.length; ++i) {
            if (gps[i].distFromStart < pro1) continue;
            if (gps[i].distFromStart > pro2) break;
            tc.lineTo(gps[i].x, gps[i].y);
        }
        var endP = pointFromProgress(pro2);
        tc.lineTo(endP.x, endP.y);
        tc.stroke();
    }
    drawTrajectory2(showInterval);
}
function drawTrajectory2(showInterval) {
    if(showAsInterval==false) showInterval = false;
    tc.beginPath();
    tc.strokeStyle = '#0000C8';
    tc.lineWidth = 3;
    tc.moveTo(gps2[0].x, gps2[0].y);
    for (i = 1; i < gps2.length; ++i) {
        tc.lineTo(gps2[i].x, gps2[i].y);
    }
    tc.stroke();
    if (showInterval) {
        var pro1 = Math.min(progress1, progress2);
        var pro2 = Math.max(progress1, progress2);
        tc.beginPath();
        tc.strokeStyle = showInterval;
        tc.lineWidth = 4;
        var startP = pointFromProgress(pro1);
        tc.moveTo(startP.x, startP.y);
        for (i = 1; i < gps2.length; ++i) {
            if (gps2[i].distFromStart < pro1) continue;
            if (gps2[i].distFromStart > pro2) break;
            tc.lineTo(gps2[i].x, gps2[i].y);
        }
        var endP = pointFromProgress(pro2);
        tc.lineTo(endP.x, endP.y);
        tc.stroke();
    }
}

function drawLeashDisc(mX, mY,good) {
    tc.beginPath();
    tc.arc(mX, mY, epsilon, 0, 2 * Math.PI, false);
    if (good) {
        tc.fillStyle = '#DFD';
        tc.strokeStyle = '#B8FFB8';
    } else {
        tc.fillStyle = '#FEE';
        tc.strokeStyle = '#FFD8D8';
    }
    tc.fill();
    tc.lineWidth = 3;
    tc.stroke();
}
function drawMarkOnTrajectory(progress, color) {
    var p = pointFromProgress(progress);
    drawMark(p);
}
function drawMarkOnTrajectory2(progress, color) {
    var p = pointFromProgress2(progress);
    drawMark(p);
}
function drawMark( p, color ) {
    tc.beginPath();
    tc.arc(p.x, p.y, 5, 0, 2 * Math.PI, false);
    tc.fillStyle = 'white';
    tc.fill();
    tc.lineWidth = 4
    tc.strokeStyle = 'black';
    tc.stroke();
}
function pointFromProgress(progress) {
    var lo = 0, hi = gps.length - 1;
    while (lo + 1 != hi) {
        var mid = Math.floor((lo + hi) / 2);
        if (progress < gps[mid].distFromStart) {
            hi = mid;
        } else {
            lo = mid;
        }
    }
    var a = (progress - gps[lo].distFromStart) / gps[lo].distToNext;
    return lerp( gps[lo], gps[lo+1], a );
}
function pointFromProgress2(progress) {
    var lo = 0, hi = gps2.length - 1;
    while (lo + 1 != hi) {
        var mid = Math.floor((lo + hi) / 2);
        if (progress < gps2[mid].distFromStart) {
            hi = mid;
        } else {
            lo = mid;
        }
    }
    var a = (progress - gps2[lo].distFromStart) / gps2[lo].distToNext;
    return lerp( gps2[lo], gps2[lo+1], a );
}

function Point(x, y) {
    this.x = x;
    this.y = y;
    this.toString = function () {
        return "( " + x + ", " + y + " )";
    };
}
function dist(x1, y1, x2, y2) {
    var dx = x2-x1;
    var dy = y2-y1;
    return Math.sqrt(dx * dx + dy * dy);
}
function lerp(p, q, a) {
    return new Point((1 - a) * p.x + a * q.x, (1 - a) * p.y + a * q.y);
}

function updateDiagram() {
    // threshold distances
    for (y = 0; y < dH; y += 1) {
        for (x = 0; x < dW; x += 1) {
            var d = distanceMap[y * dW + x];
            if (d < epsilon) {
                setPixel(imageData, x, y, 255, 255, 255, 255);
            } else {
                setPixel(imageData, x, y, 150, 150, 150, 255);
            }
        }
    }

    // draw diagram
    diagramContext.putImageData(imageData, 0, 0);
    drawCells();
	drawDiagramDiagonal();
}
function updateValid() {
    var maxIndex = dW*dH;
    for( i=0; i<maxIndex; ++i ) {
        visited[i] = 0;
        validMap[i] = 0;
    }

    var S = [0];
    while (S.length > 0) {
        var p = S.pop();
        if( distanceMap[p]<epsilon ) {
            validMap[p] = 1;
            visited[p] = 1;
            if( p-1>0 && visited[p-1]==0 ) S.push(p-1);
            if( p+1<=maxIndex && visited[p+1]==0 ) S.push(p+1);
            if( p-dW>0 && visited[p-dW]==0 ) S.push(p-dW);
            if( p+dW<=maxIndex && visited[p+dW]==0 ) S.push(p+dW);
        }
    }
}

// read gpx file
window.gps = [];
window.gps2 = [];
$.ajax({
    //url: 'gps.gpx',
    url: window.gpxFile,
    async: true,
    dataType: "xml",
    success: function (response) {
        var gpx = response.getElementsByTagName("gpx").item(0);
        var gpx2 = response.getElementsByTagName("gpx").item(1);
        var p = gpx.firstChild;
        while (p) {
            if (p.nodeName == "wpt") {
                var point = new Point(parseFloat(p.getAttribute("lon")), parseFloat(p.getAttribute("lat")) );
                gps.push(point);
            }
            p = p.nextSibling;
        }
        var p2 = gpx2.firstChild;
        while (p2) {
            if (p2.nodeName == "wpt") {
                var point = new Point(parseFloat(p2.getAttribute("lon")), parseFloat(p2.getAttribute("lat")) );
                gps2.push(point);
            }
            p2 = p2.nextSibling;
        }
        window.trajectory = document.getElementById("trajectory");
        window.tc = trajectory.getContext("2d");
        window.tW = trajectory.width;
        window.tH = trajectory.height;
        window.minX = Number.MAX_VALUE;
        window.maxX = Number.MIN_VALUE;
        window.minY = Number.MAX_VALUE;
        window.maxY = Number.MIN_VALUE;
        for (i = 0; i < gps.length; ++i) {
            if (gps[i].x < minX) minX = gps[i].x;
            if (gps[i].x > maxX) maxX = gps[i].x;
            if (gps[i].y < minY) minY = gps[i].y;
            if (gps[i].y > maxY) maxY = gps[i].y;
        }
        for (i = 0; i < gps2.length; ++i) {
            if (gps2[i].x < minX) minX = gps2[i].x;
            if (gps2[i].x > maxX) maxX = gps2[i].x;
            if (gps2[i].y < minY) minY = gps2[i].y;
            if (gps2[i].y > maxY) maxY = gps2[i].y;
        }
        window.W = maxX - minX;
        window.H = maxY - minY;
        window.midX = (minX + maxX) / 2.0;
        window.midY = (minY + maxY) / 2.0;
        window.Wfactor = tW / W;
        window.Hfactor = tH / H;
        window.scaleFactor = 0.95 * Math.min(Wfactor, Hfactor);
        for (i = 0; i < gps.length; ++i) {
            gps[i].x = (gps[i].x - midX) * scaleFactor + 0.5 * tW;
            gps[i].y = 0.5 * tH - (gps[i].y - midY) * scaleFactor;
        }
        for (i = 0; i < gps2.length; ++i) {
            gps2[i].x = (gps2[i].x - midX) * scaleFactor + 0.5 * tW;
            gps2[i].y = 0.5 * tH - (gps2[i].y - midY) * scaleFactor;
        }
        gps2 = gps2.reverse();
        window.trackLength = 0;
        window.trackLength2 = 0;
        gps[0].distFromStart = 0;
        for (i = 1; i < gps.length; ++i) {
            var d = dist(gps[i - 1].x, gps[i - 1].y, gps[i].x, gps[i].y);
            gps[i - 1].distToNext = d;
            trackLength += d;
            gps[i].distFromStart = trackLength;
        }
        gps2[0].distFromStart = 0;
        for (i = 1; i < gps2.length; ++i) {
            var d = dist(gps2[i - 1].x, gps2[i - 1].y, gps2[i].x, gps2[i].y);
            gps2[i - 1].distToNext = d;
            trackLength2 += d;
            gps2[i].distFromStart = trackLength2;
        }
        drawTrajectory();

        window.diagram = document.getElementById("diagram");
        window.diagramContext = diagram.getContext("2d");
		diagramContext.font = '30px Verdana';
        window.dW = diagram.width;
        window.dH = diagram.height;

        // precompute diagram
        window.distanceMap = new Float32Array(dW * dH);
        window.validMap = new Int8Array(dW * dH);
        window.visited = new Int8Array(dW * dH);
        for (y = 0; y < dH; y += 1) {
            for (x = 0; x < dW; x += 1) {
                var p1 = pointFromProgress(trackLength * x / dW);
                var p2 = pointFromProgress2(trackLength2 * y / dH);
                var d = dist(p1.x, p1.y, p2.x, p2.y);
                distanceMap[y * dW + x] = d;
                //distanceMap[x * dW + y] = d;
            }
        }

        window.imageData = diagramContext.createImageData(dW, dH);
        updateDiagram();

        // setup ui events
        diagram.addEventListener("mousemove", diagramMouseMove, false);
        //diagram.addEventListener("touchmove", diagramMouseMove, false);
		if( diagramInteraction) {
			diagram.addEventListener("mouseup", diagramMouseUp, false);
        }
		if (trajectoryInteraction) {
            // mouse
		    trajectory.addEventListener("mousemove", trajectoryMouseMove, false);
		    trajectory.addEventListener("mousedown", trajectoryMouseDown, false);
		    trajectory.addEventListener("mouseup", trajectoryMouseUp, false);
            // touch
		    trajectory.addEventListener("touchmove", trajectoryTouchMove, false);
		    trajectory.addEventListener("touchstart", trajectoryTouchDown, false);
		    trajectory.addEventListener("touchend", trajectoryMouseUp, false);
		}
    },
    error: function (XMLHttpRequest, textStatus, errorThrown) {
        alert('Data Could Not Be Loaded - ' + textStatus);
    }
});