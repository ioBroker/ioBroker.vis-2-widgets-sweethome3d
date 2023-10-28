import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';

import Generic from './Generic';
import View3d, { rgb2color } from './Component/View3d';

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
    }

    componentWillUnmount() {
        super.componentWillUnmount();
    }

    async onRxDataChanged() {
        await this.propertiesUpdate();
    }

    componentDidUpdate() {

    }

    onItemClick = (item, component3D) => {
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
    };

    renderWidgetBody(props) {
        super.renderWidgetBody(props);

        const content = <View3d onClick={this.onItemClick} />;

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
