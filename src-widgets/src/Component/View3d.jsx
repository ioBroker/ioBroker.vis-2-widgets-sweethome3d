import {
    useCallback, useEffect,
    useRef, useState,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';

import {
    Button, FormControl, InputLabel, LinearProgress,
    MenuItem, Select, TextField, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';

import Generic from '../Generic';
// import homeUrl from '../lib/default.sh3d';
// const homeUrl = 'http://localhost:8082/vis-2.0/main/default.sh3d';

export function rgb2color(r, g, b) {
    // eslint-disable-next-line
    return -1 * (((0xFF - r) << 16) | ((0xFF - g) << 8) | ((0xFF - b) & 0xFF));
}

const styles = {
    canvas: { width: '100%', height:'100%' },
    canvasContainer: {
        width: '100%',
        height: '100%',
        position: 'relative',
    },
    canvasContainerWithToolbar: {
        height: 'calc(100% - 57px)',
    },
    toolbar: {
        display: 'flex',
        gap: 8,
        alignItems: 'center',
    },
    container: {
        width: '100%',
        height: '100%',
        overflow: 'hidden',
    },
    toolbarContainer: {
        width: '100%',
        marginTop: 8,
    },
};

const View3d = props => {
    const [hpc, setHpc] = useState(null);
    const canvasRef = useRef(null);
    const [progress, setProgress] = useState(0);
    const [progressVisible, setProgressVisible] = useState(!!props.settings.file);
    const [progressLabel, setProgressLabel] = useState('');
    const [view, setView] = useState(props.settings.view || 'virtualVisit');
    const [levels, setLevels] = useState([]);
    const [selectedLevel, setSelectedLevel] = useState(props.settings.level || 0);
    const [cameras, setCameras] = useState([]);
    const [selectedCamera, setSelectedCamera] = useState(props.settings.camera || 0);

    useEffect(() => {
        let HPC;
        const onerror = err => {
            if (err === 'No WebGL') {
                alert('Sorry, your browser doesn\'t support WebGL.');
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
                // Model loading is finished
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

                    const _cameras = [];
                    HPC.getHome().getStoredCameras().forEach((camera, index) =>
                        _cameras.push({ name: camera.getName(), id: index, camera }));
                    setCameras(_cameras);

                    setProgressVisible(false);

                    // const HOME = HPC.getHome();
                    // here the model is loaded
                    // HOME.addFurnitureListener(e => {
                    // console.log(e);
                    // });
                    const viewerCanvas = canvasRef.current;
                    const items = HPC.getHome().getHomeObjects();
                    // const transformations = [];
                    items.forEach(item => {
                        item.originalColor = item.object3D?.userData?.color;
                        item.originalAngle = item.angle;
                        // if (item.doorOrWindow && item.modelTransformations) {
                        //     transformations.push({
                        //         catalogId: item.catalogId,
                        //         modelTransformations: item.modelTransformations,
                        //     });
                        // }
                    });
                    // console.log(JSON.stringify(transformations, null, 2));
                    const component3D = HPC.getComponent3D();
                    viewerCanvas && viewerCanvas.addEventListener('click', e => {
                        const x = e.clientX - canvasRef.current.getBoundingClientRect().left;
                        const y = e.clientY - canvasRef.current.getBoundingClientRect().top;
                        const item = component3D.getClosestSelectableItemAt(x, y);
                        if (item) {
                            props.onClick && props.onClick(item, component3D, HPC);
                        }
                    });
                    props.onLoad && props.onLoad();
                    // console.log(items);
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
            `../${props.settings.file}`,   // URL or relative URL of the home to display
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

        return () => {
            HPC && HPC.dispose();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.settings.file]);

    const goToCamera = useCallback(cameraName => {
        cameraName = cameraName || selectedCamera;
        hpc.startRotationAnimationAfterLoading = false;
        const camera = cameras[cameraName];
        hpc.getController().goToCamera(camera.camera);
        const _levels = [...levels].reverse();
        for (const i in _levels) {
            if (_levels[i].level.getElevation() < camera.camera.getZ() &&
                (_levels[parseInt(i) + 1] ? _levels[parseInt(i) + 1].level.getElevation() > camera.camera.getZ() : true)
            ) {
                setSelectedLevel(_levels[i].level.id);
                break;
            }
        }
    }, [cameras, hpc, levels, selectedCamera]);

    const toolbarVisible = props.showVirtualAerialSwitch || props.showLevelSelector || props.showCameraSelector || props.showResetCameraButton;

    return <div className={props.classes.container}>
        <div className={`${props.classes.canvasContainer}${toolbarVisible ? ` ${props.classes.canvasContainerWithToolbar}` : ''}`}>
            <canvas
                style={{ opacity: progressVisible ? 0.5 : 1 }}
                className={`viewerComponent ${props.classes.canvas}`}
                ref={canvasRef}
                // eslint-disable-next-line jsx-a11y/tabindex-no-positive
                tabIndex="1"
            ></canvas>
            {progressVisible ? <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: 20,
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    zIndex: 1,
                    width: '100%',
                }}
            >
                <div style={{ width: '100%', mr: 1 }}>
                    <LinearProgress variant="determinate" value={progress / 2} />
                </div>
                <div
                    style={{
                        minWidth: 300,
                        whiteSpace: 'nowrap',
                        marginLeft: 10,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    <Typography variant="body2" color="text.secondary">{progressLabel}</Typography>
                </div>
            </div> : <div style={{ height: 20 }} />}
        </div>
        {!progressVisible && toolbarVisible ? <div className={props.classes.toolbarContainer}>
            <div className={props.classes.toolbar}>
                {props.showVirtualAerialSwitch ? <ToggleButtonGroup
                    value={view}
                    exclusive
                    onChange={(e, value) => {
                        const home = hpc.getHome();
                        hpc.startRotationAnimationAfterLoading = false;
                        home.setCamera(value === 'aerial'
                            ? home.getTopCamera()
                            : home.getObserverCamera());
                        props.onSettingsChange && props.onSettingsChange({ view: value });
                        setView(value);
                    }}
                >
                    <ToggleButton value="virtualVisit">
                        {Generic.t('Virtual visit')}
                    </ToggleButton>
                    <ToggleButton value="aerial">
                        {Generic.t('Aerial view')}
                    </ToggleButton>
                </ToggleButtonGroup> : null}
                {props.showLevelSelector && levels?.length ? <TextField
                    select
                    variant="standard"
                    label={Generic.t('Level')}
                    value={selectedLevel}
                    onChange={e => {
                        hpc.startRotationAnimationAfterLoading = false;
                        hpc.getHome().setSelectedLevel(levels.find(level => level.id === e.target.value).level);
                        setSelectedLevel(e.target.value);
                        props.onSettingsChange && props.onSettingsChange({ level: e.target.value });
                    }}
                >
                    {levels.map(level => <MenuItem key={level.id} value={level.id}>{level.name}</MenuItem>)}
                </TextField> : null}
                {props.showCameraSelector && cameras?.length ? <FormControl variant="standard">
                    <InputLabel>{Generic.t('Camera')}</InputLabel>
                    <Select
                        value={selectedCamera}
                        onChange={e => {
                            setSelectedCamera(e.target.value);
                            props.onSettingsChange && props.onSettingsChange({ camera: e.target.value });
                            goToCamera(e.target.value);
                        }}
                    >
                        {cameras.map((camera, index) =>
                            <MenuItem key={index} value={camera.id}>{camera.name}</MenuItem>)}
                    </Select>
                </FormControl> : null}
                {props.showCameraSelector || props.showResetCameraButton ? <Button
                    variant="outlined"
                    color="grey"
                    onClick={() => goToCamera()}
                >
                    {Generic.t('Reset camera view')}
                </Button> : null}
            </div>
        </div> : null}
    </div>;
};

View3d.propTypes = {
    settings: PropTypes.object,
    onSettingsChange: PropTypes.func,
    onClick: PropTypes.func,
    HpcCallback: PropTypes.func,
    onLoad: PropTypes.func,
    showVirtualAerialSwitch: PropTypes.bool,
    showLevelSelector: PropTypes.bool,
    showCameraSelector: PropTypes.bool,
    showResetCameraButton: PropTypes.bool,
};

export default withStyles(styles)(View3d);
