import { v4 as uuidv4 } from 'uuid';
import { useEffect, useRef, useState } from 'react';
import { MenuItem, Select, ToggleButton, ToggleButtonGroup } from '@mui/material';

import homeUrl from '../lib/default.sh3d';
// const homeUrl = 'http://localhost:8082/vis-2.0/main/default.sh3d';

export function rgb2color(r, g, b) {
    return -1 * ((0xFF - r) << 16 | (0xFF - g) << 8 | (0xFF - b) & 0xFF);
}

const View3d = props => {
    const [hpc, setHpc] = useState(null);
    const canvasRef = useRef(null);
    const shadowRef = useRef(null);
    const [progress, setProgress] = useState(0);
    const [progressVisible, setProgressVisible] = useState(true);
    const [progressLabel, setProgressLabel] = useState('');
    const [view, setView] = useState('virtualVisit');
    const [levels, setLevels] = useState([]);
    const [selectedLevel, setSelectedLevel] = useState(0);

    useEffect(() => {
        let HPC;
        const onerror = err => {
            if (err === 'No WebGL') {
                alert("Sorry, your browser doesn't support WebGL.");
            } else {
                // console.log(err.stack);
                alert(`Error: ${err.message  ? `${err.constructor.name} ${err.message}`  : err
                }${window.location.href.indexOf('file://') === 0 ? '\nCheck your browser is allowed to access local files.' : ''}`);
            }
        };
        const onprogression = (part, info, percentage) => {
            if (part === window.HomeRecorder.READING_HOME) {
            // Home loading is finished
                setProgress(percentage * 100);
                info = info.substring(info.lastIndexOf('/') + 1);
            } else if (part === window.Node3D.READING_MODEL) {
            // Models loading is finished
                setProgress(100 + percentage * 100);
                if (percentage === 1) {
                    const _levels = [];
                    HPC.getHome().getLevels().forEach(level => {
                        if (level.isViewable()) {
                            _levels.push({ id: level.id, name: level.getName(), level });
                            if (level === HPC.getHome().getSelectedLevel()) {
                                setSelectedLevel(level.id);
                            }
                        }
                    });
                    setLevels(_levels.reverse());
                    setProgressVisible(false);

                    const HOME = HPC.getHome();
                    // here the model is loaded
                    HOME.addFurnitureListener(e => {
                        // console.log(e);
                    });
                    const viewerCanvas = canvasRef.current;
                    const items = HOME.getSelectableViewableItems();
                    // console.log(items);
                    const component3D = HPC.getComponent3D();
                    viewerCanvas.addEventListener('click', e => {
                        const x = e.clientX - canvasRef.current.getBoundingClientRect().left;
                        const y = e.clientY - canvasRef.current.getBoundingClientRect().top;
                        const item = component3D.getClosestSelectableItemAt(x, y);
                        if (item) {
                            props.onClick && props.onClick(item, component3D, HPC);
                        }
                    });
                }
            }

            // console.log(HPC);

            setProgressLabel(`${(percentage ? `${Math.floor(percentage * 100)}% ` : '') + part} ${info}`);
        };
        // Display home in canvas 3D
        // Mouse and keyboard navigation explained at
        // http://sweethome3d.cvs.sf.net/viewvc/sweethome3d/SweetHome3D/src/com/eteks/sweethome3d/viewcontroller/resources/help/en/editing3DView.html
        // You may also switch between aerial view and virtual visit with the space bar
        // For browser compatibility, see http://caniuse.com/webgl
        canvasRef.current.id = uuidv4();
        HPC = window.viewHome(
            canvasRef.current.id,    // Id of the canvas
            homeUrl,           // URL or relative URL of the home to display
            onerror,           // Callback called in case of error
            onprogression,     // Callback called while loading
            {
                roundsPerMinute: 0,                    // Rotation speed of the animation launched once home is loaded in rounds per minute, no animation if missing or equal to 0
                navigationPanel: 'none',               // Displayed navigation arrows, "none" or "default" for default one or an HTML string containing elements with data-simulated-key
                // attribute set "UP", "DOWN", "LEFT", "RIGHT"... to replace the default navigation panel, "none" if missing
                // aerialViewButtonId: 'aerialView',      // Id of the aerial view radio button, radio buttons hidden if missing
                // virtualVisitButtonId: 'virtualVisit',  // Id of the aerial view radio button, radio buttons hidden if missing
                // levelsAndCamerasListId: 'levelsAndCameras',          // Id of the levels and cameras select component, hidden if missing
                /* level: "Roof", */                                    // Uncomment to select the displayed level, default level if missing */
                /* selectableLevels: ["Ground floor", "Roof"], */       // Uncomment to choose the list of displayed levels, no select component if empty array */
                /* camera: "Exterior view", */                          // Uncomment to select a camera, default camera if missing */
                /* selectableCameras: ["Exterior view", "Kitchen"], */  // Uncomment to choose the list of displayed cameras, no camera if missing */
                activateCameraSwitchKey: true,                        // Switch between top view / virtual visit with space bar if not false or missing */
            },
        );
        setHpc(HPC);
        props.HpcCallback && props.HpcCallback(HPC);
    }, []);

    return <div style={{
        flex:1, width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
    }}
    >
        <div ref={shadowRef}></div>
        <div style={{ flex:1, minHeight: 0 }}>
            <canvas
                className="viewerComponent"
                ref={canvasRef}
                style={{ width: '100%', height:'100%' }}
                // style="background-color: #CCCCCC; border: 1px solid gray; outline:none; touch-action: none"
                tabIndex="1"
            ></canvas>
        </div>
        <div style={{ width: '100%' }}>
            {progressVisible ? <div>
                <progress
                    value={progress}
                    max="200"
                ></progress>
                <label>
                    {progressLabel}
                </label>
            </div> : null}
            <div>
                <ToggleButtonGroup
                    value={view}
                    exclusive
                    onChange={(e, value) => {
                        const home = hpc.getHome();
                        hpc.startRotationAnimationAfterLoading = false;
                        home.setCamera(value === 'aerial'
                            ? home.getTopCamera()
                            : home.getObserverCamera());
                        setView(value);
                    }}
                >
                    <ToggleButton value="virtualVisit">
                    Virtual visit
                    </ToggleButton>
                    <ToggleButton value="aerial">
                    Aerial view
                    </ToggleButton>
                </ToggleButtonGroup>
                <Select
                    value={selectedLevel}
                    onChange={e => {
                        hpc.startRotationAnimationAfterLoading = false;
                        hpc.getHome().setSelectedLevel(levels.find(level => level.id === e.target.value).level);
                        setSelectedLevel(e.target.value);
                    }}
                >
                    {levels.map(level => <MenuItem key={level.id} value={level.id}>{level.name}</MenuItem>)}
                </Select>
            </div>
        </div>
    </div>;
};

export default View3d;
