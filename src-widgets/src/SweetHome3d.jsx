import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';

import Generic from './Generic';

const styles = () => ({

});

class SweetHome3d extends Generic {
    canvasRef = React.createRef();

    constructor(props) {
        super(props);
        this.state.showDialog = false;
        this.state.dialogTab = 0;
        this.onStateChanged = this.onStateChanged.bind(this);
        this.refContainer = React.createRef();
    }

    static getWidgetInfo() {
        return {
            id: 'tplMaterial2SweetHome3d',
            visSet: 'vis-2-widgets-sweethome3d',

            visSetLabel: 'set_label', // Label of this widget set
            visSetColor: '#0783ff', // Color of this widget set

            visWidgetLabel: 'sweet_home_3d',  // Label of widget
            visName: 'Sweet home 3d',
            visAttrs: [
                {
                    name: 'common',
                    fields: [
                        {
                            name: 'noCard',
                            label: 'without_card',
                            type: 'checkbox',
                        },
                        {
                            name: 'widgetTitle',
                            label: 'name',
                            hidden: '!!data.noCard',
                        },
                    ],
                },
            ],
            visDefaultStyle: {
                width: '100%',
                height: 120,
                position: 'relative',
            },
            visPrev: 'widgets/vis-2-widgets-material/img/prev_actual.png',
        };
    }

    // eslint-disable-next-line class-methods-use-this
    getWidgetInfo() {
        return SweetHome3d.getWidgetInfo();
    }

    async propertiesUpdate() {
    }

    async componentDidMount() {
        super.componentDidMount();
        await this.propertiesUpdate();
        function rgb2color(r, g, b) {
            return -1 * ((0xFF - r) << 16 | (0xFF - g) << 8 | (0xFF - b) & 0xFF);
        }
        let HPC;
        const homeUrl = 'sweethome3d/default.sh3d';
        const onerror = err => {
            if (err === 'No WebGL') {
                alert("Sorry, your browser doesn't support WebGL.");
            } else {
                console.log(err.stack);
                alert(`Error: ${err.message  ? `${err.constructor.name} ${err.message}`  : err
                }${window.location.href.indexOf('file://') === 0 ? '\nCheck your browser is allowed to access local files.' : ''}`);
            }
        };
        const onprogression = (part, info, percentage) => {
            const progress = document.getElementById('viewerProgress');
            if (part === window.HomeRecorder.READING_HOME) {
            // Home loading is finished
                progress.value = percentage * 100;
                info = info.substring(info.lastIndexOf('/') + 1);
            } else if (part === window.Node3D.READING_MODEL) {
            // Models loading is finished
                progress.value = 100 + percentage * 100;
                if (percentage === 1) {
                    document.getElementById('viewerProgressDiv').style.visibility = 'hidden';

                    const HOME = HPC.getHome();
                    // here the model is loaded
                    HOME.addFurnitureListener(e => {
                        console.log(e);
                    });
                    const viewerCanvas = document.getElementById('viewerCanvas');
                    const items = HOME.getSelectableViewableItems();
                    console.log(items);
                    const component3D = HPC.getComponent3D();
                    viewerCanvas.addEventListener('click', e => {
                        const x = e.clientX - this.canvasRef.current.getBoundingClientRect().left;
                        const y = e.clientY - this.canvasRef.current.getBoundingClientRect().top;
                        const item = component3D.getClosestSelectableItemAt(x, y);
                        if (item) {
                            console.log(item);
                            const color = item.object3D.userData.color;
                            item.object3D.userData.color = rgb2color(0, 255, 0);
                            component3D.updateObjects([item]);

                            // item.visible = !item.visible;

                            if (item.doorOrWindow) {
                                if (!item.originalAngle) {
                                    item.originalAngle = item.angle;
                                }
                                if (item.angle === item.originalAngle) {
                                    item.angle += 10;
                                } else {
                                    item.angle = item.originalAngle;
                                }
                            }

                            setTimeout(() => {
                                item.object3D.userData.color = color;
                                component3D.updateObjects([item]);
                            }, 300);
                            console.log(item);
                        }
                    });
                }
            }

            document.getElementById('viewerProgressLabel').innerHTML =
            `${(percentage ? `${Math.floor(percentage * 100)}% ` : '') + part} ${info}`;
        };

        // Display home in canvas 3D
        // Mouse and keyboard navigation explained at
        // http://sweethome3d.cvs.sf.net/viewvc/sweethome3d/SweetHome3D/src/com/eteks/sweethome3d/viewcontroller/resources/help/en/editing3DView.html
        // You may also switch between aerial view and virtual visit with the space bar
        // For browser compatibility, see http://caniuse.com/webgl
        HPC = window.viewHome(
            'viewerCanvas',    // Id of the canvas
            homeUrl,           // URL or relative URL of the home to display
            onerror,           // Callback called in case of error
            onprogression,     // Callback called while loading
            {
                roundsPerMinute: 0,                    // Rotation speed of the animation launched once home is loaded in rounds per minute, no animation if missing or equal to 0
                navigationPanel: 'none',               // Displayed navigation arrows, "none" or "default" for default one or an HTML string containing elements with data-simulated-key
                // attribute set "UP", "DOWN", "LEFT", "RIGHT"... to replace the default navigation panel, "none" if missing
                aerialViewButtonId: 'aerialView',      // Id of the aerial view radio button, radio buttons hidden if missing
                virtualVisitButtonId: 'virtualVisit',  // Id of the aerial view radio button, radio buttons hidden if missing
                levelsAndCamerasListId: 'levelsAndCameras',          // Id of the levels and cameras select component, hidden if missing
                /* level: "Roof", */                                    // Uncomment to select the displayed level, default level if missing */
                /* selectableLevels: ["Ground floor", "Roof"], */       // Uncomment to choose the list of displayed levels, no select component if empty array */
                /* camera: "Exterior view", */                          // Uncomment to select a camera, default camera if missing */
                /* selectableCameras: ["Exterior view", "Kitchen"], */  // Uncomment to choose the list of displayed cameras, no camera if missing */
                activateCameraSwitchKey: true,                        // Switch between top view / virtual visit with space bar if not false or missing */
            },
        );
    }

    componentWillUnmount() {
        super.componentWillUnmount();
    }

    async onRxDataChanged() {
        await this.propertiesUpdate();
    }

    componentDidUpdate() {

    }

    renderWidgetBody(props) {
        super.renderWidgetBody(props);

        const content = <div style={{
            flex:1, width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
        }}
        >
            <div style={{ flex:1, minHeight: 0 }}>
                <canvas
                    id="viewerCanvas"
                    className="viewerComponent"
                    ref={this.canvasRef}
                    style={{ width: '100%', height:'100%' }}
                    // style="background-color: #CCCCCC; border: 1px solid gray; outline:none; touch-action: none"
                    tabIndex="1"
                ></canvas>
            </div>
            <div style={{ width: '100%' }}>
                <div
                    id="viewerProgressDiv"
                // style="width: 400px; position: relative; top: -350px; left: 200px; background-color: rgba(128, 128, 128, 0.7); padding: 20px; border-radius: 25px"
                >
                    <progress
                        id="viewerProgress"
                        className="viewerComponent"
                        value="0"
                        max="200"
                    // style="width: 400px"
                    ></progress>
                    <label
                        id="viewerProgressLabel"
                        className="viewerComponent"
                    // style="margin-top: 2px; display: block; margin-left: 10px"
                    ></label>
                </div>
                <div
                    id="viewerNavigationDiv"
                // style="margin-top: -60px"
                >
                    <input
                        id="aerialView"
                        className="viewerComponent"
                        name="cameraType"
                        type="radio"
                    // style="visibility: hidden;"
                    />
                    <label
                        className="viewerComponent"
                        htmlFor="aerialView"
                    // style="visibility: hidden;"
                    >
Aerial view
                    </label>
                    <input
                        id="virtualVisit"
                        className="viewerComponent"
                        name="cameraType"
                        type="radio"
                    // style="visibility: hidden;"
                    />
                    <label
                        className="viewerComponent"
                        htmlFor="virtualVisit"
                    // style="visibility: hidden;"
                    >
Virtual visit
                    </label>
                    <select
                        id="levelsAndCameras"
                        className="viewerComponent"
                    // style="visibility: hidden;"
                    ></select>
                </div>
            </div>
        </div>;

        return this.wrapContent(
            content,
        );
    }
}

SweetHome3d.propTypes = {
    systemConfig: PropTypes.object,
    socket: PropTypes.object,
    themeType: PropTypes.string,
    style: PropTypes.object,
    data: PropTypes.object,
};

export default withStyles(styles)(SweetHome3d);
