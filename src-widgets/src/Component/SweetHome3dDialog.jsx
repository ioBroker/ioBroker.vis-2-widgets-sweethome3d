import {
    Button, Dialog, DialogActions, DialogContent, IconButton, MenuItem, Select, TextField,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { useEffect, useRef, useState } from 'react';
import View3d, { rgb2color } from './View3d';

const useStateRef = initialValue => {
    const [value, setValue] = useState(initialValue);
    const ref = useRef(value);
    ref.current = value;
    return [value, setValue, () => ref.current];
};

const SweetHome3dDialog = props => {
    const [settings, setSettings, settingsRef] = useStateRef({
        items: [],
    });
    const [selectItem, setSelectItem, selectItemRef] = useStateRef(null);

    useEffect(() => {
        if (props.settings) {
            setSettings(props.settings);
        }
    }, [props.open]);

    const [hpc, setHpc, hpcRef] = useStateRef(null);

    const onItemClick = (item, component3D, hpc) => {
        const color = item.object3D.userData.color;
        item.object3D.userData.color = rgb2color(0, 255, 0);
        component3D.updateObjects([item]);

        if (selectItemRef() !== null) {
            const items = JSON.parse(JSON.stringify(settingsRef().items));
            items[selectItemRef()].id = item.id;
            setSettings({ ...settings, items });
            setSelectItem(null);
        }

        // item.visible = !item.visible;

        if (item.doorOrWindow) {
            if (item.originalAngle === undefined) {
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
    };
    return <Dialog open={props.open} onClose={props.onClose} fullScreen>
        <DialogContent>
            <div style={{
                display: 'flex',
                width: '100%',
                height: '100%',
            }}
            >
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                }}
                >
                    <View3d onClick={onItemClick} HpcCallback={_hpc => setHpc(_hpc)} />
                </div>
                <div style={{ flex: 1 }}>
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
                        settings.items.map((item, i) => <div key={item.id}>
                            <div>
                                <TextField
                                    variant="standard"
                                    label="Id"
                                    value={item.id}
                                    onChange={e => {
                                        const items = JSON.parse(JSON.stringify(settings.items));
                                        items[i].id = e.target.value;
                                        setSettings({ ...settings, items });
                                    }}
                                />
                                <Button
                                    variant="contained"
                                    onClick={() => {
                                        setSelectItem(i);
                                    }}
                                >
                                Select
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={() => {
                                        const homeItems = hpc.getHome().getSelectableViewableItems();
                                        console.log(homeItems);
                                        const homeItem = homeItems.find(_item => _item.id === item.id);
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
                                >
                                Glow
                                </Button>
                            </div>
                            <div>
                                <Select
                                    variant="standard"
                                    value={item.oid1type}
                                    onChange={e => {
                                        const items = JSON.parse(JSON.stringify(settings.items));
                                        items[i].oid1type = e.target.value;
                                        setSettings({ ...settings, items });
                                    }}
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
                                />
                            </div>
                            <div>
                                <Select
                                    variant="standard"
                                    value={item.oid2type}
                                    onChange={e => {
                                        const items = JSON.parse(JSON.stringify(settings.items));
                                        items[i].oid2type = e.target.value;
                                        setSettings({ ...settings, items });
                                    }}
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
                                />
                            </div>
                            <IconButton onClick={() => {
                                const items = JSON.parse(JSON.stringify(settings.items));
                                items.splice(i, 1);
                                setSettings({ ...settings, items });
                            }}
                            >
                                <Delete />
                            </IconButton>
                        </div>)
                    }
                </div>
            </div>
        </DialogContent>
        <DialogActions>
            <Button
                variant="contained"
                onClick={props.onClose}
            >
Close
            </Button>
            <Button
                variant="contained"
                onClick={() => props.onChange(settings)}
            >
Save
            </Button>
        </DialogActions>
    </Dialog>;
};

export default SweetHome3dDialog;
