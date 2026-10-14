import React from 'react';
import Color from 'color';

import { Button } from '@mui/material';

import type {
    AnyWidgetId,
    RxRenderWidgetProps,
    RxWidgetInfo,
    RxWidgetInfoCustomComponentProperties,
    VisRxWidgetState,
    WidgetData,
} from '@iobroker/types-vis-2';

import Generic from './Generic';
import View3d, { rgb2color } from './Component/View3d';
import SweetHome3dDialog from './Component/SweetHome3dDialog';
import type { HomePreviewComponent, SH3DHomeObject, SweetHome3dSettings } from './types';

// The viewer scripts are stored as *.txt, so that the bundler copies them as they are and only gives back their URL
import big from './lib/big.min.txt?url';
import glMatrix from './lib/gl-matrix-min.txt?url';
import jsZip from './lib/jszip.min.txt?url';
import core from './lib/core.min.txt?url';
import geom from './lib/geom.min.txt?url';
import stroke from './lib/stroke.min.txt?url';
import batik from './lib/batik-svgpathparser.min.txt?url';
import jsXmlSaxParser from './lib/jsXmlSaxParser.min.txt?url';
import triangulator from './lib/triangulator.min.txt?url';
import viewModel from './lib/viewmodel.min.txt?url';
import viewHome from './lib/viewhome.min.txt?url';

interface CustomSettingsProps {
    data: WidgetData;
    setData: (data: WidgetData) => void;
    props: RxWidgetInfoCustomComponentProperties;
}

const CustomSettings = (props: CustomSettingsProps): React.JSX.Element => {
    const [open, setOpen] = React.useState(false);

    return (
        <>
            {open ? (
                <SweetHome3dDialog
                    onClose={() => {
                        setOpen(false);
                        window.hpcShowViewer?.();
                    }}
                    settings={props.data.settings}
                    onChange={data => props.setData({ ...props.data, settings: data })}
                    socket={props.props.context.socket}
                    moreProps={props.props}
                    theme={props.props.context.theme}
                />
            ) : null}
            <Button
                variant="contained"
                onClick={() => {
                    setOpen(true);
                    window.hpcHideViewer?.();
                }}
            >
                {Generic.t('Settings')}
            </Button>
        </>
    );
};

const styles: Record<string, React.CSSProperties> = {
    content: {
        width: '100%',
        display: 'grid',
        gridTemplateRows: 'auto min-content min-content',
        height: '100%',
    },
};

interface SweetHome3dRxData {
    noCard: boolean;
    widgetTitle: string;
    settings: SweetHome3dSettings;
    showVirtualAerialSwitch: boolean;
    showLevelSelector: boolean;
    showCameraSelector: boolean;
    showResetCameraButton: boolean;
}

interface SweetHome3dState extends VisRxWidgetState {
    /** IDs of the states that are subscribed */
    subscriptions: string[];
    /** If the home is loaded and the 3D objects can be updated */
    viewLoaded: boolean;
    /** If all scripts of the viewer are loaded */
    allScriptsLoaded: boolean;
    hpc: HomePreviewComponent | null;
    /** The 3D view is hidden while the configuration dialog is open */
    hideViewer: boolean;
}

interface ViewerScript {
    file: string;
    loaded: boolean;
}

export default class SweetHome3d extends Generic<SweetHome3dRxData, SweetHome3dState> {
    private readonly divRef = React.createRef<HTMLDivElement>();

    private oldWidth: number | undefined;

    private oldHeight: number | undefined;

    /** The scripts are loaded only once for all widgets, and in this order */
    static scriptsLoaded: ViewerScript[] | null = null;

    constructor(props: SweetHome3d['props']) {
        super(props);
        SweetHome3d.scriptsLoaded ||= [
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

        this.state = {
            ...this.state,
            subscriptions: [],
            viewLoaded: false,
            hpc: null,
            hideViewer: false,
            allScriptsLoaded: !SweetHome3d.scriptsLoaded.find(script => !script.loaded),
        };
    }

    loadScript(script: ViewerScript): Promise<void> {
        return new Promise((resolve, reject) => {
            const element = document.createElement('script');
            element.onload = () => {
                script.loaded = true;
                resolve();
                const allScriptsLoaded = !SweetHome3d.scriptsLoaded?.find(_script => !_script.loaded);
                if (allScriptsLoaded) {
                    this.setState({ allScriptsLoaded });
                }
            };
            element.onerror = reject;
            element.src = script.file;
            element.type = 'text/javascript';

            document.getElementsByTagName('HEAD')[0].appendChild(element);
        });
    }

    static getWidgetInfo(): RxWidgetInfo {
        return {
            id: 'tplMaterial2SweetHome3d',
            visSet: 'vis-2-widgets-sweethome3d',

            visSetLabel: 'set_label', // Label of this widget set
            visSetColor: '#0783ff', // Color of this widget set

            visWidgetLabel: 'sweet_home_3d', // Label of widget
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
                            // vis-2 takes over any default value; the type only declares primitive ones
                            default: { items: [] } as unknown as string,
                            component: (_field, data, setData, props): React.JSX.Element => (
                                <CustomSettings
                                    data={data}
                                    setData={setData}
                                    props={props}
                                />
                            ),
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

    getWidgetInfo(): RxWidgetInfo {
        return SweetHome3d.getWidgetInfo();
    }

    hideViewer = (): void => this.setState({ hideViewer: true });

    showViewer = (): void => this.setState({ hideViewer: false });

    onState = (id: string, state: ioBroker.State | null | undefined): void => {
        if (!this.state.viewLoaded) {
            return;
        }
        const hpc = this.state.hpc;
        const home = hpc?.getHome();
        const component3D = hpc?.getComponent3D();
        if (!home || !component3D) {
            return;
        }
        this.state.rxData.settings?.items?.forEach(item => {
            if (item.oid1 !== id) {
                return;
            }
            const homeItem: SH3DHomeObject | undefined = home.getHomeObjects().find(_item => _item.name === item.id);
            let value = !!state?.val;
            if (item.invert1) {
                value = !value;
            }
            if (!homeItem) {
                return;
            }
            if (item.oid1type === 'show') {
                homeItem.visible = value;
                component3D.updateObjects([homeItem]);
            } else if (item.oid1type === 'color') {
                if (homeItem.object3D) {
                    const color = Color(item.color);
                    homeItem.object3D.userData.color = value
                        ? rgb2color(color.red(), color.green(), color.blue())
                        : homeItem.originalColor;
                }
                component3D.updateObjects([homeItem]);
            } else if (item.oid1type === 'open') {
                const originalAngle = homeItem.originalAngle ?? homeItem.angle;
                if (value) {
                    homeItem.angle = originalAngle + Number(item.angle || 45) * (Math.PI / 180);
                } else {
                    homeItem.angle = originalAngle;
                }
                component3D.updateObjects([homeItem]);
            }
        });
    };

    propertiesUpdate(): void {
        const settings = this.state.rxData.settings;
        if (!settings) {
            return;
        }
        const socket = this.props.context.socket;
        this.state.subscriptions.forEach(oid => socket.unsubscribeState(oid, this.onState));

        const subscriptions: string[] = [];
        settings.items?.forEach(item => {
            [item.oid1, item.oid2].forEach(oid => {
                if (oid && !subscriptions.includes(oid)) {
                    subscriptions.push(oid);
                    void socket.subscribeState(oid, this.onState);
                    void socket.getState(oid).then(state => this.onState(oid, state));
                }
            });
        });
        this.setState({ subscriptions });
    }

    async loadScripts(): Promise<void> {
        for (const script of SweetHome3d.scriptsLoaded || []) {
            if (!script.loaded) {
                await this.loadScript(script);
            }
        }
    }

    componentDidMount(): void {
        window.hpcHideViewer = this.hideViewer;
        window.hpcShowViewer = this.showViewer;
        super.componentDidMount();
        this.loadScripts()
            .then(() => this.propertiesUpdate())
            .catch(e => console.error(`Cannot load SweetHome3D viewer: ${e}`));
    }

    componentWillUnmount(): void {
        window.hpcHideViewer = null;
        window.hpcShowViewer = null;
        this.state.subscriptions.forEach(oid => this.props.context.socket.unsubscribeState(oid, this.onState));
        super.componentWillUnmount();
    }

    onRxDataChanged(): void {
        this.propertiesUpdate();
    }

    onItemClick = (item: SH3DHomeObject): void => {
        const socket = this.props.context.socket;
        this.state.rxData.settings?.items
            ?.filter(_item => _item.id === item.name)
            .forEach(_item => {
                if (_item.oid2type === 'state') {
                    if (_item.oid2) {
                        void socket.getState(_item.oid2).then(state => socket.setState(_item.oid2, !state?.val));
                    }
                } else if (_item.oid2type === 'widget' && _item.widget) {
                    const refWidget = this.props.askView?.('getRef', { id: _item.widget as AnyWidgetId });
                    refWidget?.onCommand('openDialog');
                }
            });
    };

    renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element | React.JSX.Element[] | null {
        super.renderWidgetBody(props);
        if (!this.state.allScriptsLoaded) {
            return null;
        }

        const widgets = this.props.view ? this.props.context.views?.[this.props.view]?.widgets : undefined;

        const tree3widgets = widgets
            ? Object.keys(widgets).filter(
                  widgetId => widgets[widgetId as AnyWidgetId].tpl === 'tplMaterial2SweetHome3d',
              )
            : [];

        if (
            this.divRef.current &&
            (this.divRef.current.offsetWidth !== this.oldWidth || this.divRef.current.offsetHeight !== this.oldHeight)
        ) {
            this.state.hpc?.getComponent3D()?.revalidate();
            this.oldWidth = this.divRef.current.offsetWidth;
            this.oldHeight = this.divRef.current.offsetHeight;
        }

        const content = (
            <div
                ref={this.divRef}
                style={styles.content}
            >
                {this.state.hideViewer ||
                tree3widgets[0] !== this.props.id ||
                !this.state.rxData.settings?.file ? null : (
                    <View3d
                        settings={this.state.rxData.settings}
                        onClick={this.onItemClick}
                        HpcCallback={hpc => this.setState({ hpc })}
                        onLoad={() =>
                            this.setState({ viewLoaded: true }, () =>
                                this.state.subscriptions.forEach(oid => {
                                    void this.props.context.socket
                                        .getState(oid)
                                        .then(state => this.onState(oid, state));
                                }),
                            )
                        }
                        showVirtualAerialSwitch={this.state.rxData.showVirtualAerialSwitch}
                        showLevelSelector={this.state.rxData.showLevelSelector}
                        showCameraSelector={this.state.rxData.showCameraSelector}
                        showResetCameraButton={this.state.rxData.showResetCameraButton}
                    />
                )}
                {tree3widgets.length > 1 && tree3widgets[0] !== this.props.id && (
                    <div style={{ textAlign: 'center' }}>{Generic.t('Only one widget per view is supported')}</div>
                )}
            </div>
        );

        return this.wrapContent(content);
    }
}
