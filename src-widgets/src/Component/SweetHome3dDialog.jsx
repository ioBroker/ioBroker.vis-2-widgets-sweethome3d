import {
    Button, Dialog, DialogActions, DialogContent, IconButton, MenuItem, Select, TextField,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { useEffect, useRef, useState } from 'react';
import { withStyles } from '@mui/styles';
import { SelectID } from '@iobroker/adapter-react-v5';
import View3d, { rgb2color } from './View3d';
import Generic from '../Generic';

const useStateRef = initialValue => {
    const [value, setValue] = useState(initialValue);
    const ref = useRef(value);
    ref.current = value;
    return [value, setValue, () => ref.current];
};

const styles = {
    oid: {
        display: 'flex',
        gap: 8,
        alignItems: 'end',
    },
    fields: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
    },
    dialog: {
        display: 'flex',
        width: '100%',
        height: '100%',
        gap: 20,
    },
};

const SweetHome3dDialogItem = props => {
    const {
        item, i, settings, setSettings, selectItem, setSelectItem, dialogs, setDialogs, select, hpc,
    } = props;

    return <div key={item.id}>
        <div className={props.classes.fields}>
            <div className={props.classes.oid}>
                <TextField
                    variant="standard"
                    label="Id"
                    value={item.id}
                    onChange={e => {
                        const items = JSON.parse(JSON.stringify(settings.items));
                        items[i].id = e.target.value;
                        setSettings({ ...settings, items });
                    }}
                    disabled={select && selectItem !== i}
                />
                <Button
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
                    {Generic.t('Select')}
                </Button>
                <Button
                    variant="contained"
                    onClick={() => {
                        const homeItems = hpc.getHome().getHomeObjects();
                        console.log(homeItems);
                        const homeItem = homeItems[item.id];
                        if (homeItem) {
                            const color = homeItem.object3D.userData.color;
                            homeItem.object3D.userData.color = rgb2color(0, 255, 0);
                            const component3D = hpc.getComponent3D();
                            component3D.updateObjects([homeItem]);
                            setTimeout(() => {
                                homeItem.object3D.userData.color = color;
                                component3D.updateObjects([homeItem]);
                            }, 300);
                        }
                    }}
                    color="grey"
                    disabled={select}
                >
                    {Generic.t('Glow')}
                </Button>
            </div>
            <div className={props.classes.oid}>
                <Select
                    variant="standard"
                    value={item.oid1type}
                    onChange={e => {
                        const items = JSON.parse(JSON.stringify(settings.items));
                        items[i].oid1type = e.target.value;
                        setSettings({ ...settings, items });
                    }}
                    disabled={select}
                >
                    {['show', 'color', 'open'].map(type => <MenuItem key={type} value={type}>{type}</MenuItem>)}
                </Select>
                <TextField
                    variant="standard"
                    label="Oid 1"
                    value={item.oid1}
                    onChange={e => {
                        const items = JSON.parse(JSON.stringify(settings.items));
                        items[i].oid1 = e.target.value;
                        setSettings({ ...settings, items });
                    }}
                    disabled={select}
                />
                <Button
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
            <div className={props.classes.oid}>
                <Select
                    variant="standard"
                    value={item.oid2type}
                    onChange={e => {
                        const items = JSON.parse(JSON.stringify(settings.items));
                        items[i].oid2type = e.target.value;
                        setSettings({ ...settings, items });
                    }}
                    disabled={select}
                >
                    {['state', 'widget'].map(type => <MenuItem key={type} value={type}>{type}</MenuItem>)}
                </Select>
                <TextField
                    variant="standard"
                    label="Oid 2"
                    value={item.oid2}
                    onChange={e => {
                        const items = JSON.parse(JSON.stringify(settings.items));
                        items[i].oid2 = e.target.value;
                        setSettings({ ...settings, items });
                    }}
                    disabled={select}
                />
                <Button
                    onClick={() => {
                        const _dialogs = JSON.parse(JSON.stringify(dialogs));
                        _dialogs[`${i}-2`] = true;
                        setDialogs(_dialogs);
                    }}
                    color="grey"
                    disabled={select}
                >
...
                </Button>
                {dialogs[`${i}-2`] && <SelectID
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
            <div>
                <IconButton onClick={() => {
                    const items = JSON.parse(JSON.stringify(settings.items));
                    items.splice(i, 1);
                    setSettings({ ...settings, items });
                }}
                >
                    <Delete />
                </IconButton>
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

    useEffect(() => {
        if (props.settings) {
            setSettings(props.settings);
        }
    }, [props.open]);

    const [hpc, setHpc, hpcRef] = useStateRef(null);

    const disabled = JSON.stringify(settings) === JSON.stringify(props.settings);
    const select = selectItem !== null;

    const onItemClick = (item, component3D, hpc) => {
        const color = item.object3D.userData.color;
        item.object3D.userData.color = rgb2color(0, 255, 0);
        component3D.updateObjects([item]);

        if (selectItemRef() !== null) {
            const items = JSON.parse(JSON.stringify(settingsRef().items));
            // items[selectItemRef()].id = item.id;
            items[selectItemRef()].id = hpc.getHome().getHomeObjects().findIndex(_item => _item.id === item.id);
            setSettings({ ...settings, items });
            setSelectItem(null);
        }

        // item.visible = !item.visible;

        if (item.doorOrWindow) {
            if (item.angle === item.originalAngle) {
                item.angle += 10 * (Math.PI / 180);
            } else {
                item.angle = item.originalAngle;
            }
        }

        setTimeout(() => {
            item.object3D.userData.color = color;
            component3D.updateObjects([item]);
        }, 300);
    };
    return <Dialog open={props.open} onClose={props.onClose} fullScreen>
        <DialogContent>
            <div
                className={props.classes.dialog}
            >
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                }}
                >
                    <View3d onClick={onItemClick} HpcCallback={_hpc => setHpc(_hpc)} />
                </div>
                <div style={{ flex: 1, height: '100%', overflow: 'auto' }}>
                    <IconButton onClick={() => {
                        const items = JSON.parse(JSON.stringify(settings.items));
                        items.push({
                            id: '', oid1: '', oid1type: 'show', oid2: '', oid2type: 'state',
                        });
                        setSettings({ ...settings, items });
                    }}
                    >
                        <Add />
                    </IconButton>
                    {
                        settings.items.map((item, i) => <SweetHome3dDialogItem
                            key={i}
                            item={item}
                            i={i}
                            settings={settings}
                            setSettings={setSettings}
                            selectItem={selectItem}
                            setSelectItem={setSelectItem}
                            dialogs={dialogs}
                            setDialogs={setDialogs}
                            select={select}
                            hpc={hpc}
                            {...props}
                        />)
                    }
                </div>
            </div>
        </DialogContent>
        <DialogActions>
            <Button
                variant="contained"
                onClick={props.onClose}
                color="grey"
            >
Close
            </Button>
            <Button
                variant="contained"
                onClick={() => {
                    props.onChange(settings);
                    props.onClose();
                }}
                disabled={disabled}
            >
Save
            </Button>
        </DialogActions>
    </Dialog>;
};

export default withStyles(styles)(SweetHome3dDialog);
