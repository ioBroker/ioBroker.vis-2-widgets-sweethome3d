import React, { useCallback, useEffect, useRef, useState } from 'react';

import {
    Button,
    FormControl,
    InputLabel,
    LinearProgress,
    MenuItem,
    Select,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from '@mui/material';

import Generic from '../Generic';
import type {
    HomePreviewComponent,
    SH3DCamera,
    SH3DComponent3D,
    SH3DHomeObject,
    SH3DLevel,
    SweetHome3dSettings,
    SweetHome3dViewType,
} from '../types';
// import homeUrl from '../lib/default.sh3d';
// const homeUrl = 'http://localhost:8082/vis-2.0/main/default.sh3d';

export function rgb2color(r: number, g: number, b: number): number {
    return -1 * (((0xff - r) << 16) | ((0xff - g) << 8) | ((0xff - b) & 0xff));
}

const styles: Record<string, React.CSSProperties> = {
    canvas: { width: '100%', height: '100%' },
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

/** Every canvas needs a unique ID, because the viewer finds it by ID */
let canvasCounter = 0;

interface LevelEntry {
    id: string;
    name: string;
    level: SH3DLevel;
}

interface CameraEntry {
    id: number;
    name: string;
    camera: SH3DCamera;
}

export interface SweetHome3dSettingsChange {
    view?: SweetHome3dViewType;
    level?: string | number;
    camera?: number;
}

interface View3dProps {
    settings: SweetHome3dSettings;
    onSettingsChange?: (settings: SweetHome3dSettingsChange) => void;
    onClick?: (item: SH3DHomeObject, component3D: SH3DComponent3D, hpc: HomePreviewComponent) => void;
    HpcCallback?: (hpc: HomePreviewComponent) => void;
    onLoad?: () => void;
    showVirtualAerialSwitch?: boolean;
    showLevelSelector?: boolean;
    showCameraSelector?: boolean;
    showResetCameraButton?: boolean;
}

const View3d = (props: View3dProps): React.JSX.Element => {
    const [hpc, setHpc] = useState<HomePreviewComponent | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [progress, setProgress] = useState(0);
    const [progressVisible, setProgressVisible] = useState(!!props.settings.file);
    const [progressLabel, setProgressLabel] = useState('');
    const [view, setView] = useState<SweetHome3dViewType>(props.settings.view || 'virtualVisit');
    const [levels, setLevels] = useState<LevelEntry[]>([]);
    const [selectedLevel, setSelectedLevel] = useState<string | number>(props.settings.level || 0);
    const [cameras, setCameras] = useState<CameraEntry[]>([]);
    const [selectedCamera, setSelectedCamera] = useState<number>(props.settings.camera || 0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return undefined;
        }
        let HPC: HomePreviewComponent | null = null;
        const onerror = (err: Error | string): void => {
            if (err === 'No WebGL') {
                alert("Sorry, your browser doesn't support WebGL.");
            } else {
                // console.log(err.stack);
                alert(
                    `Error: ${typeof err === 'object' && err.message ? `${err.constructor.name} ${err.message}` : String(err)}${
                        window.location.href.indexOf('file://') === 0
                            ? '\nCheck your browser is allowed to access local files.'
                            : ''
                    }`,
                );
            }
        };
        const onProgression = (part: string, info: string, percentage: number): void => {
            if (part === window.HomeRecorder.READING_HOME) {
                // Home loading is finished
                setProgress(percentage * 100);
                info = info.substring(info.lastIndexOf('/') + 1);
            } else if (part === window.Node3D.READING_MODEL) {
                // Model loading is finished
                setProgress(100 + percentage * 100);
                const home = HPC?.getHome();
                if (percentage === 1 && HPC && home) {
                    const _levels: LevelEntry[] = [];
                    home.getLevels().forEach(level => {
                        if (level.isViewable()) {
                            _levels.push({ id: level.id, name: level.getName(), level });
                            if (level === home.getSelectedLevel()) {
                                setSelectedLevel(level.id);
                            }
                        }
                    });
                    setLevels(_levels.reverse());

                    const _cameras: CameraEntry[] = [];
                    home.getStoredCameras().forEach((camera, index) =>
                        _cameras.push({ name: camera.getName(), id: index, camera }),
                    );
                    setCameras(_cameras);

                    setProgressVisible(false);

                    const items = home.getHomeObjects();
                    items.forEach(item => {
                        item.originalColor = item.object3D?.userData?.color;
                        item.originalAngle = item.angle;
                    });
                    const component3D = HPC.getComponent3D();
                    const _HPC = HPC;
                    canvas.addEventListener('click', e => {
                        const rect = canvas.getBoundingClientRect();
                        const item = component3D?.getClosestSelectableItemAt(
                            e.clientX - rect.left,
                            e.clientY - rect.top,
                        );
                        if (item && component3D) {
                            props.onClick?.(item, component3D, _HPC);
                        }
                    });
                    props.onLoad?.();
                }
            }

            setProgressLabel(`${(percentage ? `${Math.floor(percentage * 100)}% ` : '') + part} ${info}`);
        };
        // Display home in canvas 3D
        // Mouse and keyboard navigation explained at
        // http://sweethome3d.cvs.sf.net/viewvc/sweethome3d/SweetHome3D/src/com/eteks/sweethome3d/viewcontroller/resources/help/en/editing3DView.html
        // You may also switch between aerial view and virtual visit with the space bar
        // For browser compatibility, see http://caniuse.com/webgl
        canvasCounter++;
        canvas.id = `sweethome3d_${Date.now()}_${canvasCounter}`;
        HPC = window.viewHome(
            canvas.id, // Id of the canvas
            `../${props.settings.file}`, // URL or relative URL of the home to display
            onerror, // Callback called in case of error
            onProgression, // Callback called while loading
            {
                roundsPerMinute: 0, // Rotation speed of the animation launched once home is loaded in rounds per minute, no animation if missing or equal to 0
                navigationPanel: 'none', // Displayed navigation arrows, "none" or "default" for default one or an HTML string containing elements with data-simulated-key
                // attribute set "UP", "DOWN", "LEFT", "RIGHT"... to replace the default navigation panel, "none" if missing
                // aerialViewButtonId: 'aerialView',      // Id of the aerial view radio button, radio buttons hidden if missing
                // virtualVisitButtonId: 'virtualVisit',  // Id of the aerial view radio button, radio buttons hidden if missing
                // levelsAndCamerasListId: 'levelsAndCameras',          // Id of the levels and cameras select component, hidden if missing
                /* level: "Roof", */ // Uncomment to select the displayed level, default level if missing */
                /* selectableLevels: ["Ground floor", "Roof"], */ // Uncomment to choose the list of displayed levels, no select component if empty array */
                /* camera: "Exterior view", */ // Uncomment to select a camera, default camera if missing */
                /* selectableCameras: ["Exterior view", "Kitchen"], */ // Uncomment to choose the list of displayed cameras, no camera if missing */
                activateCameraSwitchKey: true, // Switch between top view / virtual visit with space bar if not false or missing */
            },
        );
        setHpc(HPC);
        props.HpcCallback?.(HPC);

        return () => HPC?.dispose();
    }, [props.settings.file]);

    const goToCamera = useCallback(
        (cameraIndex?: number): void => {
            const camera = cameras[cameraIndex || selectedCamera];
            if (!hpc || !camera) {
                return;
            }
            hpc.startRotationAnimationAfterLoading = false;
            hpc.getController().goToCamera(camera.camera);
            const _levels = [...levels].reverse();
            for (let i = 0; i < _levels.length; i++) {
                if (
                    _levels[i].level.getElevation() < camera.camera.getZ() &&
                    (_levels[i + 1] ? _levels[i + 1].level.getElevation() > camera.camera.getZ() : true)
                ) {
                    setSelectedLevel(_levels[i].level.id);
                    break;
                }
            }
        },
        [cameras, hpc, levels, selectedCamera],
    );

    const toolbarVisible =
        props.showVirtualAerialSwitch ||
        props.showLevelSelector ||
        props.showCameraSelector ||
        props.showResetCameraButton;

    return (
        <div style={styles.container}>
            <div
                style={{
                    ...styles.canvasContainer,
                    ...(toolbarVisible ? styles.canvasContainerWithToolbar : undefined),
                }}
            >
                <canvas
                    style={{ ...styles.canvas, opacity: progressVisible ? 0.5 : 1 }}
                    className="viewerComponent"
                    ref={canvasRef}
                    tabIndex={1}
                ></canvas>
                {progressVisible ? (
                    <div
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
                        <div style={{ width: '100%' }}>
                            <LinearProgress
                                variant="determinate"
                                value={progress / 2}
                            />
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
                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                {progressLabel}
                            </Typography>
                        </div>
                    </div>
                ) : (
                    <div style={{ height: 20 }} />
                )}
            </div>
            {!progressVisible && toolbarVisible ? (
                <div style={styles.toolbarContainer}>
                    <div style={styles.toolbar}>
                        {props.showVirtualAerialSwitch ? (
                            <ToggleButtonGroup
                                value={view}
                                exclusive
                                onChange={(_e, value: SweetHome3dViewType | null) => {
                                    const home = hpc?.getHome();
                                    if (!value || !hpc || !home) {
                                        return;
                                    }
                                    hpc.startRotationAnimationAfterLoading = false;
                                    home.setCamera(value === 'aerial' ? home.getTopCamera() : home.getObserverCamera());
                                    props.onSettingsChange?.({ view: value });
                                    setView(value);
                                }}
                            >
                                <ToggleButton value="virtualVisit">{Generic.t('Virtual visit')}</ToggleButton>
                                <ToggleButton value="aerial">{Generic.t('Aerial view')}</ToggleButton>
                            </ToggleButtonGroup>
                        ) : null}
                        {props.showLevelSelector && levels?.length ? (
                            <TextField
                                select
                                variant="standard"
                                label={Generic.t('Level')}
                                value={selectedLevel}
                                onChange={e => {
                                    const level = levels.find(_level => _level.id === e.target.value);
                                    if (hpc && level) {
                                        hpc.startRotationAnimationAfterLoading = false;
                                        hpc.getHome()?.setSelectedLevel(level.level);
                                    }
                                    setSelectedLevel(e.target.value);
                                    props.onSettingsChange?.({ level: e.target.value });
                                }}
                            >
                                {levels.map(level => (
                                    <MenuItem
                                        key={level.id}
                                        value={level.id}
                                    >
                                        {level.name}
                                    </MenuItem>
                                ))}
                            </TextField>
                        ) : null}
                        {props.showCameraSelector && cameras?.length ? (
                            <FormControl variant="standard">
                                <InputLabel>{Generic.t('Camera')}</InputLabel>
                                <Select
                                    value={selectedCamera}
                                    onChange={e => {
                                        const camera = Number(e.target.value);
                                        setSelectedCamera(camera);
                                        props.onSettingsChange?.({ camera });
                                        goToCamera(camera);
                                    }}
                                >
                                    {cameras.map(camera => (
                                        <MenuItem
                                            key={camera.id}
                                            value={camera.id}
                                        >
                                            {camera.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        ) : null}
                        {props.showCameraSelector || props.showResetCameraButton ? (
                            <Button
                                variant="outlined"
                                color="grey"
                                onClick={() => goToCamera()}
                            >
                                {Generic.t('Reset camera view')}
                            </Button>
                        ) : null}
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default View3d;
