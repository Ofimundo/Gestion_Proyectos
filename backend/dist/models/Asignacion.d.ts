export declare class AsignacionModel {
    static assign(data: {
        solicitudId: string | number;
        profesionalId: string | number;
        estimacionHoras: number;
        fechaInicioEstimada: string;
        fechaFinEstimada: string;
    }): Promise<void>;
    static remove(profesionalId: string | number, solicitudId: string | number): Promise<void>;
    private static updateHorasMensuales;
}
export default AsignacionModel;
//# sourceMappingURL=Asignacion.d.ts.map