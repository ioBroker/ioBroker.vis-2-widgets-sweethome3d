import { useEffect, useRef, useState } from 'react';

import {
    Button, Checkbox, Dialog, DialogActions,
    DialogContent, FormControlLabel, IconButton, MenuItem,
    Select, TextField, Tooltip,
} from '@mui/material';

import {
    Add,
    Check,
    Close, Colorize,
    Delete, Visibility,
} from '@mui/icons-material';

import { SelectID, ColorPicker, SelectFile } from '@iobroker/adapter-react-v5';

import View3d, { rgb2color } from './View3d';
import Generic from '../Generic';

const useStateRef = initialValue => {
    const [value, setValue] = useState(initialValue);
    const ref = useRef(value);
    ref.current = value;
    return [value, setValue, () => ref.current];
};

const styles = {
    field: {
        display: 'flex',
        gap: 8,
        alignItems: 'end',
        width: '100%',
    },
    header: theme => ({
        mt: '10px',
        p: '5px',
        fontWeight: 'bold',
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
    }),
    fields: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
    },
    dialogContent: {
        width: 'calc(100% - 48px)',
        height: 'calc(100% - 40px)',
    },
    columnViewer: {
        verticalAlign: 'top',
        height: '100%',
        width: 'calc(100% - 490px)',
        overflow: 'auto',
        marginRight: 10,
        display: 'inline-block',
    },
    projectInput: {
        minWidth: 500,
    },
    columnsContainer: theme => ({
        verticalAlign: 'top',
        display: 'inline-block',
        width: 470,
        height: 'calc(100% - 10px)',
        overflow: 'hidden',
        backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#ccc',
        borderRadius: '5px',
        p: '5px',
    }),
    columnsList: {
        width: 150,
        overflow: 'auto',
        display: 'inline-block',
        height: 'calc(100%- 22px)',
        marginRight: 8,
        verticalAlign: 'top',
    },
    columnRight: {
        verticalAlign: 'top',
        width: 'calc(100% - 158px)',
        overflow: 'auto',
        display: 'inline-block',
        height: 'calc(100%- 22px)',
    },
    columns: {
        width: 'calc(100% - 10px)',
        height: 'calc(100% - 10px)',
    },
    dialogPaper: {
        minHeight: 'calc(100% - 48px)',
        maxHeight: 'calc(100% - 48px)',
        height: 'calc(100% - 48px)',
    },
    widget:{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        alignItems: 'start',
    },
    idButton: {
        minWidth: 40,
    },
    widgetSubname: {
        fontSize: '80%',
        fontStyle: 'italic',
    },
    tooltip: {
        pointerEvents: 'none',
    },
};

function highLightObject(hpc, item) {
    const homeItems = hpc.getHome().getHomeObjects();
    const homeItem = homeItems.find(_item => _item.name === item.id);
    if (homeItem) {
        const color = homeItem.object3D.userData.color;
        homeItem.object3D.userData.color = rgb2color(0, 200, 0);
        const component3D = hpc.getComponent3D();
        component3D.updateObjects([homeItem]);
        setTimeout(() => {
            homeItem.object3D.userData.color = color;
            component3D.updateObjects([homeItem]);
        }, 300);
    }
}

const SweetHome3dDialogItem = props => {
    const {
        item, i, settings, setSettings, selectItem, setSelectItem, dialogs, setDialogs, select, hpc,
    } = props;

    const widgets = props.moreProps.context.views[props.moreProps.selectedView].widgets;

    return <div key={item.id}>
        <div style={styles.fields}>
            <div style={styles.field}>
                <TextField
                    variant="standard"
                    label={Generic.t('Name')}
                    value={item.name}
                    onChange={e => {
                        const items = JSON.parse(JSON.stringify(settings.items));
                        items[i].name = e.target.value;
                        setSettings({ ...settings, items });
                    }}
                    disabled={select}
                />
                <Tooltip title={Generic.t('Delete')}>
                    <IconButton onClick={() => {
                        const items = JSON.parse(JSON.stringify(settings.items));
                        items.splice(i, 1);
                        setSettings({ ...settings, items });
                    }}
                    >
                        <Delete />
                    </IconButton>
                </Tooltip>
            </div>
            <div style={styles.field}>
                <TextField
                    variant="standard"
                    label={Generic.t('Id')}
                    value={item.id}
                    onChange={e => {
                        const items = JSON.parse(JSON.stringify(settings.items));
                        items[i].id = e.target.value;
                        setSettings({ ...settings, items });
                    }}
                    disabled={select && selectItem !== i}
                />
                <Tooltip title={Generic.t('Select object in 3D view')} componentsProps={{ popper: { sx: styles.tooltip } }}>
                    <span>
                        <IconButton
                            variant="contained"
                            onClick={() => {
                                if (selectItem === i) {
                                    setSelectItem(null);
                                } else {
                                    setSelectItem(i);
                                }
                            }}
                            color="grey"
                            disabled={select && selectItem !== i}
                        >
                            <Colorize />
                        </IconButton>
                    </span>
                </Tooltip>
                <Tooltip title={Generic.t('Highlight object in 3D view')} componentsProps={{ popper: { sx: styles.tooltip } }}>
                    <span>
                        <IconButton
                            variant="contained"
                            onClick={() => highLightObject(hpc, item)}
                            color="grey"
                            disabled={select || !item.id}
                        >
                            <Visibility />
                        </IconButton>
                    </span>
                </Tooltip>
            </div>
            <Box component="div" sx={styles.header}>{Generic.t('On change')}</Box>
            <div style={{ width: '100%' }}>
                <Select
                    variant="standard"
                    fullWidth
                    value={item.oid1type}
                    onChange={e => {
                        const items = JSON.parse(JSON.stringify(settings.items));
                        items[i].oid1type = e.target.value;
                        setSettings({ ...settings, items });
                    }}
                    disabled={select}
                >
                    {['show', 'color', 'open'].map(type => <MenuItem key={type} value={type}>
                        {Generic.t(`type_${type}`)}
                    </MenuItem>)}
                </Select>
            </div>
            <div style={styles.field}>
                {item.oid1type === 'color' && <ColorPicker
                    style={{ width: '100%' }}
                    value={item.color || ''}
                    onChange={color => {
                        const items = JSON.parse(JSON.stringify(settings.items));
                        items[i].color = color;
                        setSettings({ ...settings, items });
                    }}
                />}
                {item.oid1type === 'open' && <TextField
                    variant="standard"
                    label={Generic.t('Angle')}
                    value={item.angle || 0}
                    onChange={e => {
                        const items = JSON.parse(JSON.stringify(settings.items));
                        items[i].angle = e.target.value;
                        setSettings({ ...settings, items });
                    }}
                    disabled={select}
                />}
            </div>
            <div style={styles.field}>
                <TextField
                    variant="standard"
                    style={{ width: 'calc(100% - 50px)' }}
                    label={Generic.t('Object id')}
                    value={item.oid1}
                    onChange={e => {
                        const items = JSON.parse(JSON.stringify(settings.items));
                        items[i].oid1 = e.target.value;
                        setSettings({ ...settings, items });
                    }}
                    disabled={select}
                />
                <Button
                    style={styles.idButton}
                    onClick={() => {
                        const _dialogs = JSON.parse(JSON.stringify(dialogs));
                        _dialogs[`${i}-1`] = true;
                        setDialogs(_dialogs);
                    }}
                    color="grey"
                    disabled={select}
                >
                    ...
                </Button>
                {dialogs[`${i}-1`] && <SelectID
                    imagePrefix="../.."
                    selected={item.oid1}
                    onOk={selected => {
                        const items = JSON.parse(JSON.stringify(settings.items));
                        items[i].oid1 = selected;
                        setSettings({ ...settings, items });
                    }}
                    onClose={() => {
                        const _dialogs = JSON.parse(JSON.stringify(dialogs));
                        _dialogs[`${i}-1`] = false;
                        setDialogs(_dialogs);
                    }}
                    socket={props.socket}
                />}
            </div>
            <div style={styles.field}>
                <FormControlLabel
                    control={<Checkbox
                        checked={!!item.invert1}
                        onChange={e => {
                            const items = JSON.parse(JSON.stringify(settings.items));
                            items[i].invert1 = e.target.checked;
                            setSettings({ ...settings, items });
                        }}
                        disabled={select}
                    />}
                    label={Generic.t('Invert value')}
                />
            </div>
            <Box component="div" sx={styles.header}>{Generic.t('Action')}</Box>
            <div style={styles.field}>
                <Select
                    variant="standard"
                    style={{ width: '100%' }}
                    value={item.oid2type}
                    onChange={e => {
                        const items = JSON.parse(JSON.stringify(settings.items));
                        items[i].oid2type = e.target.value;
                        setSettings({ ...settings, items });
                    }}
                    disabled={select}
                >
                    {['state', 'widget'].map(type => <MenuItem key={type} value={type}>
                        {Generic.t(`type_${type}`)}
                    </MenuItem>)}
                </Select>
            </div>
            <div style={styles.field}>
                {item.oid2type === 'state' && <TextField
                    variant="standard"
                    label={Generic.t('Object id')}
                    style={{ width: 'calc(100% - 50px)' }}
                    value={item.oid2}
                    onChange={e => {
                        const items = JSON.parse(JSON.stringify(settings.items));
                        items[i].oid2 = e.target.value;
                        setSettings({ ...settings, items });
                    }}
                    disabled={select}
                />}
                {item.oid2type === 'state' && <Button
                    style={styles.idButton}
                    onClick={() => {
                        const _dialogs = JSON.parse(JSON.stringify(dialogs));
                        _dialogs[`${i}-2`] = true;
                        setDialogs(_dialogs);
                    }}
                    color="grey"
                    disabled={select}
                >
                    ...
                </Button>}
                {item.oid2type === 'widget' && <Select
                    variant="standard"
                    style={{ width: '100%' }}
                    value={item.widget}
                    onChange={e => {
                        const items = JSON.parse(JSON.stringify(settings.items));
                        items[i].widget = e.target.value;
                        setSettings({ ...settings, items });
                    }}
                    disabled={select}
                >
                    {Object.keys(widgets).map(id => {
                        const widget = widgets[id];
                        if (!widget.data.externalDialog) {
                            return null;
                        }
                        return <MenuItem key={id} value={id} style={styles.widget}>
                            <div>{id}</div>
                            <div style={styles.widgetSubname}>{widget.tpl}</div>
                        </MenuItem>;
                    })}
                </Select>}
                {dialogs[`${i}-2`] && <SelectID
                    imagePrefix="../.."
                    selected={item.oid2}
                    onOk={selected => {
                        const items = JSON.parse(JSON.stringify(settings.items));
                        items[i].oid2 = selected;
                        setSettings({ ...settings, items });
                    }}
                    onClose={() => {
                        const _dialogs = JSON.parse(JSON.stringify(dialogs));
                        _dialogs[`${i}-2`] = false;
                        setDialogs(_dialogs);
                    }}
                    socket={props.socket}
                />}
            </div>
        </div>
    </div>;
};

const SweetHome3dDialog = props => {
    const [settings, setSettings, settingsRef] = useStateRef({
        items: [],
    });
    const [selectItem, setSelectItem, selectItemRef] = useStateRef(null);
    const [dialogs, setDialogs] = useState({});
    const [fileDialog, setFileDialog] = useState(false);

    const [currentItem, setCurrentItem] = useState(0);

    useEffect(() => {
        if (props.settings) {
            setSettings(props.settings);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.open]);

    const [hpc, setHpc] = useStateRef(null);

    const disabled = JSON.stringify(settings) === JSON.stringify(props.settings);
    const select = selectItem !== null;

    const onItemClick = (item, component3D /* , _hpc */) => {
        const color = item.object3D.userData.color;
        item.object3D.userData.color = rgb2color(0, 0, 200);

        if (item.doorOrWindow) {
            // const transformation = window.java.awt.geom.AffineTransform.getTranslateInstance(item.getX(), item.getY());
            // transformation.rotate(item.getAngle());
            // transformation.translate(1 * -item.getWidth() / 2, -item.getDepth() / 2);
            // item.modelTransformations = [
            //     {
            //         getName: () => 'sweethome3d_hinge_1',
            //         getMatrix: () => [
            //             // [
            //             //     0.8848459,
            //             //     0,
            //             //     -0.46559626,
            //             //     -0.034006376
            //             // ],
            //             // [
            //             //     0,
            //             //     1,
            //             //     0,
            //             //     0
            //             // ],
            //             // [
            //             //     0.4661716,
            //             //     0,
            //             //     0.8848459,
            //             //     0.19492601
            //             // ]
            //             [
            //                 0.8848459,
            //                 0,
            //                 -0.46559626,
            //                 -0.034006376,
            //             ],
            //             [
            //                 0,
            //                 1,
            //                 0,
            //                 0,
            //             ],
            //             [
            //                 0.4661716,
            //                 0,
            //                 0.8848459,
            //                 0.19492601,
            //             ],
            //         ],
            //     },
            //     // transformation,
            // ];
        }
        component3D.updateObjects([item]);

        if (selectItemRef() !== null) {
            const items = JSON.parse(JSON.stringify(settingsRef().items));
            // items[selectItemRef()].id = item.id;
            items[selectItemRef()].id = item.name;
            if (items[selectItemRef()].name === Generic.t('Item')) {
                items[selectItemRef()].name = item.name;
            }

            setSettings({ ...settings, items });
            setSelectItem(null);
        }

        // item.visible = !item.visible;

        // if (item.doorOrWindow) {
        //     if (item.angle === item.originalAngle) {
        //         item.angle += 10 * (Math.PI / 180);
        //     } else {
        //         item.angle = item.originalAngle;
        //     }
        // }

        setTimeout(() => {
            item.object3D.userData.color = color;
            component3D.updateObjects([item]);
        }, 300);
    };

    return <Dialog
        open={!0}
        sx={{ '& .MuiDialog-paper': styles.dialogPaper }}
        onClose={props.onClose}
        fullWidth
        maxWidth="xl"
    >
        <DialogContent style={styles.dialogContent}>
            <div style={styles.columnViewer}>
                <div style={styles.field}>
                    {fileDialog && <SelectFile
                        title={Generic.t('Select file')}
                        onClose={() => setFileDialog(false)}
                        showToolbar
                        imagePrefix="../"
                        restrictToFolder={`${props.moreProps.context.adapterName}.${props.moreProps.context.instance}/${props.moreProps.context.projectName}`}
                        allowNonRestricted
                        allowUpload
                        allowDownload
                        allowCreateFolder
                        allowDelete
                        allowView
                        selected={settings.file || ''}
                        filterFiles={['sh3d']}
                        onOk={selected => setSettings({ ...settings, file: selected })}
                        socket={props.socket}
                    />}
                    <TextField
                        style={styles.projectInput}
                        variant="standard"
                        value={settings.file || ''}
                        label={!settings.file ? Generic.t('Please upload or select SweetHome 3D Project') : Generic.t('SweetHome3D File')}
                    />
                    <Button
                        variant="contained"
                        onClick={() => setFileDialog(true)}
                        color="grey"
                    >
                        ...
                    </Button>
                </div>
                <div style={{ width: '100%', height: 'calc(100% - 48px)', cursor: select ? 'crosshair' : undefined }}>
                    {settings.file ? <View3d
                        settings={settings}
                        showVirtualAerialSwitch
                        showLevelSelector
                        showCameraSelector
                        showResetCameraButton
                        onClick={onItemClick}
                        HpcCallback={_hpc => setHpc(_hpc)}
                        onSettingsChange={newSettings => setSettings({ ...settings, ...newSettings })}
                    /> : null}
                </div>
            </div>
            <Box component="div" sx={styles.columnsContainer}>
                <div style={{ width: '100%', fontWeight: 'bold', fontSize: 16 }}>{Generic.t('3D Objects')}</div>
                <div style={styles.columnsList}>
                    {settings.file ? <Tooltip title={Generic.t('Add item')}>
                        <IconButton onClick={() => {
                            const items = JSON.parse(JSON.stringify(settings.items));
                            items.push({
                                name: Generic.t('Item'),
                                id: '',
                                oid1: '',
                                oid1type: 'show',
                                oid2: '',
                                oid2type: 'state',
                                color: '#00ff00',
                                angle: 45,
                            });
                            setSettings({ ...settings, items });
                        }}
                        >
                            <Add />
                        </IconButton>
                    </Tooltip> : null}
                    {settings.items.map((item, i) => <MenuItem
                        key={i}
                        onClick={() => {
                            setCurrentItem(i);
                            settings.items[i].id && highLightObject(hpc, settings.items[i]);
                        }}
                        selected={currentItem === i}
                    >
                        {item.name || item.id}
                    </MenuItem>)}
                </div>
                <div style={styles.columnRight}>
                    {settings.items[currentItem] && <SweetHome3dDialogItem
                        {...props}
                        i={currentItem}
                        item={settings.items[currentItem]}
                        settings={settings}
                        setSettings={setSettings}
                        selectItem={selectItem}
                        setSelectItem={setSelectItem}
                        dialogs={dialogs}
                        setDialogs={setDialogs}
                        select={select}
                        hpc={hpc}
                    />}
                </div>
            </Box>
        </DialogContent>
        <DialogActions>
            <Button
                variant="contained"
                onClick={() => {
                    props.onChange(settings);
                    props.onClose();
                }}
                disabled={disabled}
                startIcon={<Check />}
            >
                {Generic.t('Save')}
            </Button>
            <Button
                variant="contained"
                onClick={props.onClose}
                color="grey"
                startIcon={<Close />}
            >
                {Generic.t('Close')}
            </Button>
        </DialogActions>
    </Dialog>;
};

export default SweetHome3dDialog;
