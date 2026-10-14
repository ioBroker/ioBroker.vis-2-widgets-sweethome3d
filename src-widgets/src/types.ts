/**
 * Types of the configuration stored in the widget and of the parts of the SweetHome3D JS viewer
 * (`src/lib/viewhome.min.txt` and friends) that are used by this widget set.
 * The viewer is not typed, so only the used members are described here.
 */

/** One 3D object of the home that is linked to ioBroker states */
export interface SweetHome3dItem {
    /** Name of the item shown in the configuration dialog */
    name: string;
    /** Name of the 3D object in the home */
    id: string;
    /** State that controls the 3D object */
    oid1: string;
    /** What happens with the 3D object if `oid1` is true */
    oid1type: 'show' | 'color' | 'open';
    /** Invert the value of `oid1` */
    invert1?: boolean;
    /** Color of the object if `oid1type` is `color` */
    color?: string;
    /** Opening angle in degrees if `oid1type` is `open`. Comes as string from the text field */
    angle?: number | string;
    /** State that is toggled by click on the 3D object */
    oid2: string;
    /** What happens by click on the 3D object */
    oid2type: 'state' | 'widget';
    /** Widget with a dialog, that is opened by click on the 3D object */
    widget?: string;
}

/** The whole configuration of the widget */
export interface SweetHome3dSettings {
    /** Path of the *.sh3d file in the ioBroker file storage */
    file?: string;
    items: SweetHome3dItem[];
    view?: SweetHome3dViewType;
    level?: string | number;
    camera?: number;
}

export type SweetHome3dViewType = 'virtualVisit' | 'aerial';

export interface SH3DLevel {
    id: string;
    getName(): string;
    isViewable(): boolean;
    getElevation(): number;
}

export interface SH3DCamera {
    getName(): string;
    getZ(): number;
}

/** A piece of furniture, door, window, light... of the home */
export interface SH3DHomeObject {
    name: string;
    visible: boolean;
    angle: number;
    doorOrWindow?: boolean;
    catalogId?: string;
    object3D?: {
        userData: {
            color?: number | null;
        };
    };
    /** Set by this widget set after the home is loaded */
    originalColor?: number | null;
    /** Set by this widget set after the home is loaded */
    originalAngle?: number;
}

export interface SH3DHome {
    getLevels(): SH3DLevel[];
    getSelectedLevel(): SH3DLevel | null;
    setSelectedLevel(level: SH3DLevel): void;
    getStoredCameras(): SH3DCamera[];
    getHomeObjects(): SH3DHomeObject[];
    getTopCamera(): SH3DCamera;
    getObserverCamera(): SH3DCamera;
    setCamera(camera: SH3DCamera): void;
}

export interface SH3DComponent3D {
    updateObjects(objects: SH3DHomeObject[]): void;
    revalidate(): void;
    getClosestSelectableItemAt(x: number, y: number): SH3DHomeObject | null;
}

/** Object returned by `viewHome()` */
export interface HomePreviewComponent {
    startRotationAnimationAfterLoading: boolean;
    getHome(): SH3DHome | null;
    getComponent3D(): SH3DComponent3D | null;
    getController(): { goToCamera(camera: SH3DCamera): void };
    dispose(): void;
}

export interface ViewHomeParameters {
    roundsPerMinute?: number;
    /** `none`, `default` or an HTML string */
    navigationPanel?: string;
    aerialViewButtonId?: string;
    virtualVisitButtonId?: string;
    levelsAndCamerasListId?: string;
    level?: string;
    selectableLevels?: string[];
    camera?: string;
    selectableCameras?: string[];
    activateCameraSwitchKey?: boolean;
}

declare global {
    interface Window {
        /** Defined by viewhome.min.js */
        viewHome: (
            canvasId: string,
            homeUrl: string,
            onerror: (err: Error | string) => void,
            onprogression: (part: string, info: string, percentage: number) => void,
            params: ViewHomeParameters,
        ) => HomePreviewComponent;
        /** Defined by viewmodel.min.js */
        HomeRecorder: { READING_HOME: string };
        /** Defined by viewmodel.min.js */
        Node3D: { READING_MODEL: string };
        /** Hide the 3D view of the widget while the configuration dialog is open */
        hpcHideViewer: (() => void) | null;
        /** Show the 3D view of the widget after the configuration dialog was closed */
        hpcShowViewer: (() => void) | null;
    }
}
