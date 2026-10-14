import React, { useEffect, useRef, useState } from 'react';

import {
    Box,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    FormControlLabel,
    IconButton,
    MenuItem,
    MenuList,
    Select,
    TextField,
    Tooltip,
} from '@mui/material';

import { Add, Check, Close, Colorize, Delete, Visibility } from '@mui/icons-material';

import { DialogSelectID, ColorPicker, DialogSelectFile, type Connection } from '@iobroker/gui-components';
import type { AnyWidgetId, RxWidgetInfoCustomComponentProperties, VisTheme } from '@iobroker/types-vis-2';

import View3d, { rgb2color } from './View3d';
import Generic from '../Generic';
import type {
    HomePreviewComponent,
    SH3DComponent3D,
    SH3DHomeObject,
    SweetHome3dItem,
    SweetHome3dSettings,
} from '../types';

function useStateRef<T>(initialValue: T): [T, (value: T) => void, () => T] {
    const [value, setValue] = useState<T>(initialValue);
    const ref = useRef<T>(value);
    ref.current = value;
    return [value, setValue, () => ref.current];
}

const styles: Record<string, any> = {
    field: {
        display: 'flex',
        gap: 8,
        alignItems: 'end',
        width: '100%',
    },
    header: (theme: VisTheme): Record<string, any> => ({
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
    columnsContainer: (theme: VisTheme): Record<string, any> => ({
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
    widget: {
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

function highLightObject(hpc: HomePreviewComponent | null, item: SweetHome3dItem): void {
    const homeItems = hpc?.getHome()?.getHomeObjects() || [];
    const homeItem = homeItems.find(_item => _item.name === item.id);
    const component3D = hpc?.getComponent3D();
    if (homeItem?.object3D && component3D) {
        const object3D = homeItem.object3D;
        const color = object3D.userData.color;
        object3D.userData.color = rgb2color(0, 200, 0);
        component3D.updateObjects([homeItem]);
        setTimeout(() => {
            object3D.userData.color = color;
            component3D.updateObjects([homeItem]);
        }, 300);
    }
}

interface SweetHome3dDialogProps {
    settings: SweetHome3dSettings;
    onChange: (settings: SweetHome3dSettings) => void;
    onClose: () => void;
    socket: Connection;
    moreProps: RxWidgetInfoCustomComponentProperties;
    theme: VisTheme;
}

interface SweetHome3dDialogItemProps extends SweetHome3dDialogProps {
    item: SweetHome3dItem;
    i: number;
    settings: SweetHome3dSettings;
    setSettings: (settings: SweetHome3dSettings) => void;
    selectItem: number | null;
    setSelectItem: (selectItem: number | null) => void;
    dialogs: Record<string, boolean>;
    setDialogs: (dialogs: Record<string, boolean>) => void;
    select: boolean;
    hpc: HomePreviewComponent | null;
}

const SweetHome3dDialogItem = (props: SweetHome3dDialogItemProps): React.JSX.Element => {
    const { item, i, settings, setSettings, selectItem, setSelectItem, dialogs, setDialogs, select, hpc } = props;

    const widgets = props.moreProps.context.views[props.moreProps.selectedView]?.widgets || {};

    /** Change one attribute of the current item */
    const changeItem = <K extends keyof SweetHome3dItem>(attr: K, value: SweetHome3dItem[K]): void => {
        const items: SweetHome3dItem[] = JSON.parse(JSON.stringify(settings.items));
        items[i][attr] = value;
        setSettings({ ...settings, items });
    };

    /** Open or close the dialog to select the ID of `oid1` or `oid2` */
    const showDialog = (index: 1 | 2, show: boolean): void => {
        const _dialogs = JSON.parse(JSON.stringify(dialogs));
        _dialogs[`${i}-${index}`] = show;
        setDialogs(_dialogs);
    };

    return (
        <div key={item.id}>
            <div style={styles.fields}>
                <div style={styles.field}>
                    <TextField
                        variant="standard"
                        label={Generic.t('Name')}
                        value={item.name}
                        onChange={e => changeItem('name', e.target.value)}
                        disabled={select}
                    />
                    <Tooltip title={Generic.t('Delete')}>
                        <IconButton
                            onClick={() => {
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
                        onChange={e => changeItem('id', e.target.value)}
                        disabled={select && selectItem !== i}
                    />
                    <Tooltip
                        title={Generic.t('Select object in 3D view')}
                        slotProps={{ popper: { sx: styles.tooltip } }}
                    >
                        <span>
                            <IconButton
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
                    <Tooltip
                        title={Generic.t('Highlight object in 3D view')}
                        slotProps={{ popper: { sx: styles.tooltip } }}
                    >
                        <span>
                            <IconButton
                                onClick={() => highLightObject(hpc, item)}
                                color="grey"
                                disabled={select || !item.id}
                            >
                                <Visibility />
                            </IconButton>
                        </span>
                    </Tooltip>
                </div>
                <Box
                    component="div"
                    sx={styles.header}
                >
                    {Generic.t('On change')}
                </Box>
                <div style={{ width: '100%' }}>
                    <Select
                        variant="standard"
                        fullWidth
                        value={item.oid1type}
                        onChange={e => changeItem('oid1type', e.target.value)}
                        disabled={select}
                    >
                        {['show', 'color', 'open'].map(type => (
                            <MenuItem
                                key={type}
                                value={type}
                            >
                                {Generic.t(`type_${type}`)}
                            </MenuItem>
                        ))}
                    </Select>
                </div>
                <div style={styles.field}>
                    {item.oid1type === 'color' && (
                        <ColorPicker
                            style={{ width: '100%' }}
                            value={item.color || ''}
                            onChange={color => changeItem('color', color)}
                        />
                    )}
                    {item.oid1type === 'open' && (
                        <TextField
                            variant="standard"
                            label={Generic.t('Angle')}
                            value={item.angle || 0}
                            onChange={e => changeItem('angle', e.target.value)}
                            disabled={select}
                        />
                    )}
                </div>
                <div style={styles.field}>
                    <TextField
                        variant="standard"
                        style={{ width: 'calc(100% - 50px)' }}
                        label={Generic.t('Object id')}
                        value={item.oid1}
                        onChange={e => changeItem('oid1', e.target.value)}
                        disabled={select}
                    />
                    <Button
                        style={styles.idButton}
                        onClick={() => showDialog(1, true)}
                        color="grey"
                        disabled={select}
                    >
                        ...
                    </Button>
                    {dialogs[`${i}-1`] && (
                        <DialogSelectID
                            theme={props.theme}
                            imagePrefix="../.."
                            selected={item.oid1}
                            onOk={selected => changeItem('oid1', (selected as string) || '')}
                            onClose={() => showDialog(1, false)}
                            socket={props.socket}
                        />
                    )}
                </div>
                <div style={styles.field}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={!!item.invert1}
                                onChange={e => changeItem('invert1', e.target.checked)}
                                disabled={select}
                            />
                        }
                        label={Generic.t('Invert value')}
                    />
                </div>
                <Box
                    component="div"
                    sx={styles.header}
                >
                    {Generic.t('Action')}
                </Box>
                <div style={styles.field}>
                    <Select
                        variant="standard"
                        style={{ width: '100%' }}
                        value={item.oid2type}
                        onChange={e => changeItem('oid2type', e.target.value)}
                        disabled={select}
                    >
                        {['state', 'widget'].map(type => (
                            <MenuItem
                                key={type}
                                value={type}
                            >
                                {Generic.t(`type_${type}`)}
                            </MenuItem>
                        ))}
                    </Select>
                </div>
                <div style={styles.field}>
                    {item.oid2type === 'state' && (
                        <TextField
                            variant="standard"
                            label={Generic.t('Object id')}
                            style={{ width: 'calc(100% - 50px)' }}
                            value={item.oid2}
                            onChange={e => changeItem('oid2', e.target.value)}
                            disabled={select}
                        />
                    )}
                    {item.oid2type === 'state' && (
                        <Button
                            style={styles.idButton}
                            onClick={() => showDialog(2, true)}
                            color="grey"
                            disabled={select}
                        >
                            ...
                        </Button>
                    )}
                    {item.oid2type === 'widget' && (
                        <Select
                            variant="standard"
                            style={{ width: '100%' }}
                            value={item.widget || ''}
                            onChange={e => changeItem('widget', e.target.value)}
                            disabled={select}
                        >
                            {Object.keys(widgets).map(id => {
                                const widget = widgets[id as AnyWidgetId];
                                if (!widget.data.externalDialog) {
                                    return null;
                                }
                                return (
                                    <MenuItem
                                        key={id}
                                        value={id}
                                        style={styles.widget}
                                    >
                                        <div>{id}</div>
                                        <div style={styles.widgetSubname}>{widget.tpl}</div>
                                    </MenuItem>
                                );
                            })}
                        </Select>
                    )}
                    {dialogs[`${i}-2`] && (
                        <DialogSelectID
                            theme={props.theme}
                            imagePrefix="../.."
                            selected={item.oid2}
                            onOk={selected => changeItem('oid2', (selected as string) || '')}
                            onClose={() => showDialog(2, false)}
                            socket={props.socket}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

const SweetHome3dDialog = (props: SweetHome3dDialogProps): React.JSX.Element => {
    const [settings, setSettings, settingsRef] = useStateRef<SweetHome3dSettings>({
        items: [],
    });
    const [selectItem, setSelectItem, selectItemRef] = useStateRef<number | null>(null);
    const [dialogs, setDialogs] = useState<Record<string, boolean>>({});
    const [fileDialog, setFileDialog] = useState(false);

    const [currentItem, setCurrentItem] = useState(0);

    useEffect(() => {
        if (props.settings) {
            setSettings(props.settings);
        }
    }, []);

    const [hpc, setHpc] = useStateRef<HomePreviewComponent | null>(null);

    const disabled = JSON.stringify(settings) === JSON.stringify(props.settings);
    const select = selectItem !== null;

    const onItemClick = (item: SH3DHomeObject, component3D: SH3DComponent3D): void => {
        const object3D = item.object3D;
        const color = object3D?.userData.color;
        if (object3D) {
            object3D.userData.color = rgb2color(0, 0, 200);
        }
        component3D.updateObjects([item]);

        const selected = selectItemRef();
        if (selected !== null) {
            // This handler was registered when the home was loaded, so the settings must be read from the ref
            const currentSettings = settingsRef();
            const items: SweetHome3dItem[] = JSON.parse(JSON.stringify(currentSettings.items));
            items[selected].id = item.name;
            if (items[selected].name === Generic.t('Item')) {
                items[selected].name = item.name;
            }

            setSettings({ ...currentSettings, items });
            setSelectItem(null);
        }

        setTimeout(() => {
            if (object3D) {
                object3D.userData.color = color;
            }
            component3D.updateObjects([item]);
        }, 300);
    };

    const context = props.moreProps.context;

    return (
        <Dialog
            open={!0}
            sx={{ '& .MuiDialog-paper': styles.dialogPaper }}
            onClose={props.onClose}
            fullWidth
            maxWidth="xl"
        >
            <DialogContent style={styles.dialogContent}>
                <div style={styles.columnViewer}>
                    <div style={styles.field}>
                        {fileDialog && (
                            <DialogSelectFile
                                theme={props.theme}
                                title={Generic.t('Select file')}
                                onClose={() => setFileDialog(false)}
                                showToolbar
                                imagePrefix="../"
                                restrictToFolder={`${context.adapterName}.${context.instance}/${context.projectName}`}
                                allowNonRestricted
                                allowUpload
                                allowDownload
                                allowCreateFolder
                                allowDelete
                                allowView
                                selected={settings.file || ''}
                                filterFiles={['sh3d']}
                                onOk={selected => setSettings({ ...settings, file: selected as string })}
                                socket={props.socket}
                            />
                        )}
                        <TextField
                            style={styles.projectInput}
                            variant="standard"
                            value={settings.file || ''}
                            label={
                                !settings.file
                                    ? Generic.t('Please upload or select SweetHome 3D Project')
                                    : Generic.t('SweetHome3D File')
                            }
                        />
                        <Button
                            variant="contained"
                            onClick={() => setFileDialog(true)}
                            color="grey"
                        >
                            ...
                        </Button>
                    </div>
                    <div
                        style={{
                            width: '100%',
                            height: 'calc(100% - 48px)',
                            cursor: select ? 'crosshair' : undefined,
                        }}
                    >
                        {settings.file ? (
                            <View3d
                                settings={settings}
                                showVirtualAerialSwitch
                                showLevelSelector
                                showCameraSelector
                                showResetCameraButton
                                onClick={onItemClick}
                                HpcCallback={_hpc => setHpc(_hpc)}
                                onSettingsChange={newSettings => setSettings({ ...settingsRef(), ...newSettings })}
                            />
                        ) : null}
                    </div>
                </div>
                <Box
                    component="div"
                    sx={styles.columnsContainer}
                >
                    <div style={{ width: '100%', fontWeight: 'bold', fontSize: 16 }}>{Generic.t('3D Objects')}</div>
                    <div style={styles.columnsList}>
                        {settings.file ? (
                            <Tooltip title={Generic.t('Add item')}>
                                <IconButton
                                    onClick={() => {
                                        const items: SweetHome3dItem[] = JSON.parse(JSON.stringify(settings.items));
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
                            </Tooltip>
                        ) : null}
                        {/* MUI 9 requires MenuItem to be placed in a Menu or MenuList */}
                        <MenuList>
                            {settings.items.map((item, i) => (
                                <MenuItem
                                    key={i}
                                    onClick={() => {
                                        setCurrentItem(i);
                                        if (settings.items[i].id) {
                                            highLightObject(hpc, settings.items[i]);
                                        }
                                    }}
                                    selected={currentItem === i}
                                >
                                    {item.name || item.id}
                                </MenuItem>
                            ))}
                        </MenuList>
                    </div>
                    <div style={styles.columnRight}>
                        {settings.items[currentItem] && (
                            <SweetHome3dDialogItem
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
                            />
                        )}
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
        </Dialog>
    );
};

export default SweetHome3dDialog;
