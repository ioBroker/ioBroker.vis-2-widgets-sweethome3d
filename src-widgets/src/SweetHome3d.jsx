import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';
import Color from 'color';

import { Button } from '@mui/material';

import Generic from './Generic';
import View3d, { rgb2color } from './Component/View3d';

import big from './lib/big.min.txt';
import glMatrix from './lib/gl-matrix-min.txt';
import jsZip from './lib/jszip.min.txt';
import core from './lib/core.min.txt';
import geom from './lib/geom.min.txt';
import stroke from './lib/stroke.min.txt';
import batik from './lib/batik-svgpathparser.min.txt';
import jsXmlSaxParser from './lib/jsXmlSaxParser.min.txt';
import triangulator from './lib/triangulator.min.txt';
import viewModel from './lib/viewmodel.min.txt';
import viewHome from './lib/viewhome.min.txt';
import SweetHome3dDialog from './Component/SweetHome3dDialog';
// import transformations from './Component/transformations';

const CustomSettings = props => {
    const [open, setOpen] = React.useState(false);

    return <>
        {open ? <SweetHome3dDialog
            onClose={() => {
                setOpen(false);
                window.hpcShowViewer && window.hpcShowViewer();
            }}
            settings={props.data.settings}
            onChange={data => {
                props.setData({ ...props.data, settings: data });
            }}
            socket={props.context.socket}
            moreProps={props.props}
        /> : null}
        <Button
            variant="contained"
            onClick={() => {
                setOpen(true);
                window.hpcHideViewer && window.hpcHideViewer();
            }}
        >
            {Generic.t('Settings')}
        </Button>
    </>;
};

const styles = () => ({
    content: {
        width: '100%',
        display: 'grid',
        gridTemplateRows: 'auto min-content min-content',
        height: '100%',
    },
});

class SweetHome3d extends Generic {
    divRef = React.createRef();

    static scriptsLoaded = null;

    constructor(props) {
        super(props);
        this.state.showDialog = false;
        SweetHome3d.scriptsLoaded = SweetHome3d.scriptsLoaded || [
            { file: big, loaded: false },
            { file: glMatrix, loaded: false },
            { file: jsZip, loaded: false },
            { file: core, loaded: false },
            { file: geom, loaded: false },
            { file: stroke, loaded: false },
            { file: batik, loaded: false },
            { file: jsXmlSaxParser, loaded: false },
            { file: triangulator, loaded: false },
            { file: viewModel, loaded: false },
            { file: viewHome, loaded: false },
        ];

        this.state.subscriptions = [];
        this.state.viewLoaded = false;
        this.state.allScriptsLoaded = !SweetHome3d.scriptsLoaded.find(script => !script.loaded);
        // this.state.widgetDialog = null;
    }

    async loadScript(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.onload = () => {
                const scriptLoaded = SweetHome3d.scriptsLoaded.find(_script => _script.file === url);
                scriptLoaded.loaded = true;
                resolve();
                const allScriptsLoaded = !SweetHome3d.scriptsLoaded.find(_script => !_script.loaded);
                if (allScriptsLoaded) {
                    this.setState({ allScriptsLoaded });
                }
            };
            script.onerror = reject;
            script.src = url;
            script.type = 'text/javascript';

            document.getElementsByTagName('HEAD')[0].appendChild(script);
        });
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
                        {
                            name: 'settings',
                            label: 'settings',
                            default: {
                                items: [],
                            },
                            component: (field, data, setData, props) => <CustomSettings
                                field={field}
                                data={data}
                                setData={setData}
                                context={props.context}
                                props={props}
                            />,
                            type: 'custom',
                        },
                        {
                            name: 'showVirtualAerialSwitch',
                            label: 'show_virtual_aerial_switch',
                            type: 'checkbox',
                            default: true,
                        },
                        {
                            name: 'showLevelSelector',
                            label: 'show_level_selector',
                            type: 'checkbox',
                            default: true,
                        },
                        {
                            name: 'showCameraSelector',
                            label: 'show_camera_selector',
                            type: 'checkbox',
                            default: true,
                        },
                        {
                            name: 'showResetCameraButton',
                            label: 'show_reset_camera_button',
                            type: 'checkbox',
                            hidden: '!!data.showCameraSelector',
                            default: true,
                        },
                    ],
                },
            ],
            visDefaultStyle: {
                width: '100%',
                height: '100%',
                top: 0,
                left: 0,
            },
            visPrev: 'widgets/vis-2-widgets-sweethome3d/img/prev_3dview.png',
        };
    }

    // eslint-disable-next-line class-methods-use-this
    getWidgetInfo() {
        return SweetHome3d.getWidgetInfo();
    }

    hideViewer = () => this.setState({ hideViewer: true });

    showViewer = () => this.setState({ hideViewer: false });

    onState = (id, state) => {
        if (!this.state.viewLoaded) {
            return;
        }
        if (this.state.hpc && this.state.hpc.getHome()) {
            this.state.rxData.settings.items.forEach(item => {
                if (item.oid1 === id) {
                    const homeItems = this.state.hpc.getHome().getHomeObjects();
                    const homeItem = homeItems.find(_item => _item.name === item.id);
                    let value = !!state.val;
                    if (item.invert1) {
                        value = !value;
                    }
                    if (homeItem) {
                        if (item.oid1type === 'show') {
                            homeItem.visible = value;
                            const component3D = this.state.hpc.getComponent3D();
                            component3D.updateObjects([homeItem]);
                        } else if (item.oid1type === 'color') {
                            const color = Color(item.color);
                            homeItem.object3D.userData.color = value ? rgb2color(color.red(), color.green(), color.blue()) : homeItem.originalColor;
                            const component3D = this.state.hpc.getComponent3D();
                            component3D.updateObjects([homeItem]);
                        } else if (item.oid1type === 'open') {
                            if (value) {
                                // const transformation = transformations.find(_transformation => _transformation.catalogId === homeItem.catalogId);
                                // if (transformation) {
                                //     homeItem.modelTransformations = {
                                //         getName: () => transformation.modelTransformations.name,
                                //         getMatrix: () => transformation.modelTransformations.matrix,
                                //     };
                                // }
                                homeItem.angle = homeItem.originalAngle + (item.angle || 45) * (Math.PI / 180);
                            } else {
                                // homeItem.modelTransformations = [];
                                homeItem.angle = homeItem.originalAngle;
                            }
                            const component3D = this.state.hpc.getComponent3D();
                            component3D.updateObjects([homeItem]);
                        }
                    }
                }
            });
        }
    };

    async propertiesUpdate() {
        if (!this.state.rxData.settings) {
            return;
        }
        this.state.subscriptions.forEach(subscription => this.props.context.socket.unsubscribeState(subscription, this.onState));
        this.setState({ subscriptions: [] }, () =>
            this.state.rxData.settings.items.forEach(item => {
                [1, 2].forEach(i => {
                    const oid = item[`oid${i}`];
                    if (oid && !this.state.subscriptions.includes(oid)) {
                        this.props.context.socket.subscribeState(oid, this.onState);
                        this.props.context.socket.getState(oid)
                            .then(state => this.onState(oid, state));
                        this.setState(state => {
                            state.subscriptions.push(oid);
                            return state;
                        });
                    }
                });
            }));
    }

    async componentDidMount() {
        window.hpcHideViewer = this.hideViewer;
        window.hpcShowViewer = this.showViewer;
        super.componentDidMount();
        for (const i in SweetHome3d.scriptsLoaded) {
            const script = SweetHome3d.scriptsLoaded[i];
            if (!script.loaded) {
                await this.loadScript(script.file);
            }
        }

        await this.propertiesUpdate();
    }

    componentWillUnmount() {
        window.hpcHideViewer = null;
        window.hpcShowViewer = null;
        super.componentWillUnmount();
    }

    async onRxDataChanged() {
        await this.propertiesUpdate();
    }

    componentDidUpdate() {

    }

    renderDialog() {
        return <SweetHome3dDialog
            open={this.state.showDialog}
            onClose={() => this.setState({ showDialog: false })}
            settings={this.state.rxData.settings}
            onChange={data => {
                this.props.onChangeSettings(data);
                this.setState({ rxData: { ...this.state.rxData, settings: data } });
                setTimeout(() => this.propertiesUpdate(), 1000);
            }}
            socket={this.props.context.socket}
        />;
    }

    // renderWidgetDialog() {
    //     return <Dialog open={!!this.state.widgetDialog} onClose={() => this.setState({ widgetDialog: null })}>
    //         <DialogContent>
    //             {this.state.widgetDialog && this.getWidgetInWidget(this.props.view, this.state.widgetDialog)}
    //         </DialogContent>
    //     </Dialog>;
    // }

    onItemClick = item => {
        // const color = item.object3D.userData.color;
        // item.object3D.userData.color = rgb2color(0, 255, 0);
        // component3D.updateObjects([item]);

        // item.visible = !item.visible;

        // if (item.doorOrWindow) {
        //     if (item.angle === item.originalAngle) {
        //         item.angle += 10 * (Math.PI / 180);
        //     } else {
        //         item.angle = item.originalAngle;
        //     }
        // }

        this.state.rxData.settings.items.filter(_item => _item.id === item.name).forEach(_item => {
            if (_item.oid2) {
                if (_item.oid2type === 'state') {
                    this.props.context.socket.getState(_item.oid2).then(state =>
                        this.props.context.socket.setState(_item.oid2, !state.val));
                } else if (_item.oid2type === 'widget') {
                    // this.setState({ widgetDialog: _item.widget });
                    const refWidget = this.props.askView && this.props.askView('getRef', { id: _item.widget });
                    refWidget?.onCommand('openDialog');
                }
            }
        });

        // setTimeout(() => {
        //     item.object3D.userData.color = color;
        //     component3D.updateObjects([item]);
        // }, 300);
    };

    renderWidgetBody(props) {
        super.renderWidgetBody(props);
        if (!this.state.allScriptsLoaded) {
            return null;
        }

        const widgets = this.props.context.views && this.props.view && this.props.context.views[this.props.view].widgets;

        const tree3widgets = this.props.context.views && this.props.view && widgets ?
            Object.keys(widgets)
                .filter(widgetId => widgets[widgetId].tpl === 'tplMaterial2SweetHome3d')
            : [];

        if (this.divRef.current && (this.divRef.current.offsetWidth !== this.oldWidth || this.divRef.current.offsetHeight !== this.oldHeight)) {
            if (this.state.hpc && this.state.hpc.getComponent3D()) {
                this.state.hpc.getComponent3D().revalidate();
            }
            this.oldWidth = this.divRef.current.offsetWidth;
            this.oldHeight = this.divRef.current.offsetHeight;
        }

        const content = <div
            ref={this.divRef}
            className={this.props.classes.content}
        >
            {this.state.showDialog || this.state.hideViewer || tree3widgets[0] !== this.props.id ? null : <View3d
                settings={this.state.rxData.settings}
                onClick={this.onItemClick}
                HpcCallback={hpc => this.setState({ hpc })}
                onLoad={() => {
                    this.state.subscriptions.forEach(oid => {
                        this.props.context.socket.getState(oid).then(state => this.onState(oid, state));
                        this.setState({ viewLoaded: true });
                    });
                }}
                showVirtualAerialSwitch={this.state.rxData.showVirtualAerialSwitch}
                showLevelSelector={this.state.rxData.showLevelSelector}
                showCameraSelector={this.state.rxData.showCameraSelector}
                showResetCameraButton={this.state.rxData.showResetCameraButton}
            />}
            {tree3widgets.length > 1 && tree3widgets[0] !== this.props.id && <div style={{ textAlign: 'center' }}>
                {Generic.t('Only one widget per view is supported')}
            </div>}
            {/* this.renderWidgetDialog() */}
            {this.props.fake && <>
                {this.renderDialog()}
                <Button
                    variant="contained"
                    onClick={() => this.setState({
                        showDialog: true,
                        viewLoaded: false,
                    })}
                >
                    Open dialog
                </Button>
            </>}
        </div>;

        return this.wrapContent(content);
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
