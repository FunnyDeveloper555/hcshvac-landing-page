import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2 } from "lucide-react";
import PhotoSlot from "./PhotoSlot";
import {
  HEATING_TYPES, POISE_OPTIONS, WIDTH_OPTIONS, AFUE_OPTIONS, STAGE_OPTIONS,
  ENERGY_SUPPLY, VOLTAGE_OPTIONS, BTU_KW, AGE_OPTIONS, THERMOSTAT_OPTIONS,
  COOLING_LOCATION, COOLING_ACCESS, COOLING_MOUNTING,
  HP_OPTIONS, PIPE_OPTIONS,
  WATER_HEATER_TYPES, WATER_HEATER_CAPACITY, WATER_HEATER_VENT, WATER_HEATER_LOCATION,
  HEATING_PHOTO_SLOTS, COOLING_PHOTO_SLOTS, SUMP_PHOTO_SLOTS, EJECTOR_PHOTO_SLOTS,
  WATER_HEATER_PHOTO_SLOTS, FILTER_SIZE_PHOTO_SLOTS, FILTER_QUANTITY_OPTIONS,
  BELT_SIZE_PHOTO_SLOTS, FIELD_DOCUMENTS_PHOTO_SLOTS,
  BOILER_TYPES, BOILER_PHOTO_SLOTS, RTU_TYPES, RTU_TONNAGE, PHASE_OPTIONS, RTU_PHOTO_SLOTS,
  BOILER_HEATING_TYPES, BOILER_SIZE_CATEGORY, BOILER_ENERGY_SUPPLY,
} from "./options";


export type SystemKind = "heating" | "cooling" | "sump_pump" | "ejector_pump" | "water_heater" | "boiler" | "rtu";


export interface SystemRow {
  id: string;
  kind: SystemKind;
  index: number;
  data: Record<string, any>;
}

interface Props {
  profileId: string;
  system: SystemRow;
  onChange: (data: Record<string, any>) => void;
  onDelete: () => void;
}

const Field = ({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) => (
  <div className={`space-y-1 ${className || ""}`}>
    <Label className="text-xs">{label}</Label>
    {children}
  </div>
);

const SelectField = ({
  value, onChange, options, placeholder,
}: {
  value: string; onChange: (v: string) => void; options: string[]; placeholder?: string;
}) => (
  <Select value={value || ""} onValueChange={onChange}>
    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={placeholder || "Select"} /></SelectTrigger>
    <SelectContent>
      {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
    </SelectContent>
  </Select>
);

export default function SystemCard({ profileId, system, onChange, onDelete }: Props) {
  const d = system.data || {};
  const set = (k: string, v: any) => onChange({ ...d, [k]: v });

  const kindLabel: Record<SystemKind, string> = {
    heating: "Heating System",
    cooling: "Cooling System",
    sump_pump: "Sump Pump",
    ejector_pump: "Ejector Pump",
    water_heater: "Water Heater",
    boiler: "Boiler",
    rtu: "RTU (Roof Top Unit)",
  };

  const boilerLabel = (label: string) => {
    if (system.kind !== "boiler") return label;
    if (label === "Filter Size") return "Pre Filter";
    if (label === "Belt Size") return "Expansion Tank";
    if (label === "Field Documents") return "Site Glass";
    return label;
  };




  return (
    <div className="border rounded-lg p-3 space-y-3 bg-muted/20">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">{kindLabel[system.kind]} #{system.index}</h4>
        <Button size="sm" variant="ghost" onClick={onDelete} type="button">
          <Trash2 className="h-3 w-3 text-destructive" />
        </Button>
      </div>

      {system.kind === "heating" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Field label="Type"><SelectField value={d.type} onChange={(v) => set("type", v)} options={HEATING_TYPES} /></Field>
            <Field label="Brand"><Input className="h-8 text-xs" value={d.brand || ""} onChange={(e) => set("brand", e.target.value)} /></Field>
            <Field label="Model #"><Input className="h-8 text-xs" value={d.model_number || ""} onChange={(e) => set("model_number", e.target.value)} /></Field>
            <Field label="Serial #"><Input className="h-8 text-xs" value={d.serial_number || ""} onChange={(e) => set("serial_number", e.target.value)} /></Field>
            <Field label="Poise"><SelectField value={d.poise} onChange={(v) => set("poise", v)} options={POISE_OPTIONS} /></Field>
            <Field label="Width"><SelectField value={d.width} onChange={(v) => set("width", v)} options={WIDTH_OPTIONS} /></Field>
            <Field label="AFUE"><SelectField value={d.afue} onChange={(v) => set("afue", v)} options={AFUE_OPTIONS} /></Field>
            <Field label="Stage"><SelectField value={d.stage} onChange={(v) => set("stage", v)} options={STAGE_OPTIONS} /></Field>
            <Field label="Energy Supply"><SelectField value={d.energy_supply} onChange={(v) => set("energy_supply", v)} options={ENERGY_SUPPLY} /></Field>
            <Field label="Voltage"><SelectField value={d.voltage} onChange={(v) => set("voltage", v)} options={VOLTAGE_OPTIONS} /></Field>
            <Field label="BTU / KW"><SelectField value={d.btu_kw} onChange={(v) => set("btu_kw", v)} options={BTU_KW} /></Field>
            <Field label="Age"><SelectField value={d.age} onChange={(v) => set("age", v)} options={AGE_OPTIONS} /></Field>
            <Field label="Thermostat"><SelectField value={d.thermostat} onChange={(v) => set("thermostat", v)} options={THERMOSTAT_OPTIONS} /></Field>
          </div>
          <Field label="Notes / Observations">
            <Textarea className="text-xs min-h-[60px]" value={d.notes || ""} onChange={(e) => set("notes", e.target.value)} />
          </Field>
        </>
      )}

      {system.kind === "cooling" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Field label="Brand"><Input className="h-8 text-xs" value={d.brand || ""} onChange={(e) => set("brand", e.target.value)} /></Field>
            <Field label="Model #"><Input className="h-8 text-xs" value={d.model_number || ""} onChange={(e) => set("model_number", e.target.value)} /></Field>
            <Field label="Serial #"><Input className="h-8 text-xs" value={d.serial_number || ""} onChange={(e) => set("serial_number", e.target.value)} /></Field>
            <Field label="Age"><SelectField value={d.age} onChange={(v) => set("age", v)} options={AGE_OPTIONS} /></Field>
            <Field label="Location"><SelectField value={d.location} onChange={(v) => set("location", v)} options={COOLING_LOCATION} /></Field>
            <Field label="Access"><SelectField value={d.access} onChange={(v) => set("access", v)} options={COOLING_ACCESS} /></Field>
            <Field label="Mounting"><SelectField value={d.mounting} onChange={(v) => set("mounting", v)} options={COOLING_MOUNTING} /></Field>
            <Field label="Voltage"><SelectField value={d.voltage} onChange={(v) => set("voltage", v)} options={VOLTAGE_OPTIONS} /></Field>
          </div>
          <Field label="Notes / Observations">
            <Textarea className="text-xs min-h-[60px]" value={d.notes || ""} onChange={(e) => set("notes", e.target.value)} />
          </Field>
        </>
      )}

      {(system.kind === "sump_pump" || system.kind === "ejector_pump") && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Field label="Brand"><Input className="h-8 text-xs" value={d.brand || ""} onChange={(e) => set("brand", e.target.value)} /></Field>
            <Field label="Model #"><Input className="h-8 text-xs" value={d.model_number || ""} onChange={(e) => set("model_number", e.target.value)} /></Field>
            <Field label="HP"><SelectField value={d.hp} onChange={(v) => set("hp", v)} options={HP_OPTIONS} /></Field>
            <Field label="Pipe Size"><SelectField value={d.pipe_size} onChange={(v) => set("pipe_size", v)} options={PIPE_OPTIONS} /></Field>
            <Field label="Age"><SelectField value={d.age} onChange={(v) => set("age", v)} options={AGE_OPTIONS} /></Field>
            <Field label="Voltage"><SelectField value={d.voltage} onChange={(v) => set("voltage", v)} options={VOLTAGE_OPTIONS} /></Field>
          </div>
          <Field label="Notes / Observations">
            <Textarea className="text-xs min-h-[60px]" value={d.notes || ""} onChange={(e) => set("notes", e.target.value)} />
          </Field>
        </>
      )}

      {system.kind === "water_heater" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Field label="Type"><SelectField value={d.type} onChange={(v) => set("type", v)} options={WATER_HEATER_TYPES} /></Field>
            <Field label="Brand"><Input className="h-8 text-xs" value={d.brand || ""} onChange={(e) => set("brand", e.target.value)} /></Field>
            <Field label="Model #"><Input className="h-8 text-xs" value={d.model_number || ""} onChange={(e) => set("model_number", e.target.value)} /></Field>
            <Field label="Serial #"><Input className="h-8 text-xs" value={d.serial_number || ""} onChange={(e) => set("serial_number", e.target.value)} /></Field>
            <Field label="Capacity"><SelectField value={d.capacity} onChange={(v) => set("capacity", v)} options={WATER_HEATER_CAPACITY} /></Field>
            <Field label="Energy Supply"><SelectField value={d.energy_supply} onChange={(v) => set("energy_supply", v)} options={ENERGY_SUPPLY} /></Field>
            <Field label="Voltage"><SelectField value={d.voltage} onChange={(v) => set("voltage", v)} options={VOLTAGE_OPTIONS} /></Field>
            <Field label="BTU / KW"><SelectField value={d.btu_kw} onChange={(v) => set("btu_kw", v)} options={BTU_KW} /></Field>
            <Field label="Venting"><SelectField value={d.venting} onChange={(v) => set("venting", v)} options={WATER_HEATER_VENT} /></Field>
            <Field label="Location"><SelectField value={d.location} onChange={(v) => set("location", v)} options={WATER_HEATER_LOCATION} /></Field>
            <Field label="Age"><SelectField value={d.age} onChange={(v) => set("age", v)} options={AGE_OPTIONS} /></Field>
            <Field label="Expansion Tank"><SelectField value={d.expansion_tank} onChange={(v) => set("expansion_tank", v)} options={["Yes", "No", "UNKNOWN"]} /></Field>
            <Field label="Recirculation Pump"><SelectField value={d.recirc_pump} onChange={(v) => set("recirc_pump", v)} options={["Yes", "No", "UNKNOWN"]} /></Field>
            <Field label="Drip Pan"><SelectField value={d.drip_pan} onChange={(v) => set("drip_pan", v)} options={["Yes", "No", "UNKNOWN"]} /></Field>
          </div>
          <Field label="Notes / Observations">
            <Textarea className="text-xs min-h-[60px]" value={d.notes || ""} onChange={(e) => set("notes", e.target.value)} />
          </Field>
        </>
      )}

      {system.kind === "boiler" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Field label="Heating Type"><SelectField value={d.heating_type} onChange={(v) => set("heating_type", v)} options={BOILER_HEATING_TYPES} /></Field>
            <Field label="Boiler Type"><SelectField value={d.type} onChange={(v) => set("type", v)} options={BOILER_TYPES} /></Field>
            <Field label="Size Category"><SelectField value={d.size_category} onChange={(v) => set("size_category", v)} options={BOILER_SIZE_CATEGORY} /></Field>
            <Field label="Energy Supply"><SelectField value={d.energy_supply} onChange={(v) => set("energy_supply", v)} options={BOILER_ENERGY_SUPPLY} /></Field>
            <Field label="Voltage"><SelectField value={d.voltage} onChange={(v) => set("voltage", v)} options={VOLTAGE_OPTIONS} /></Field>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Field label="Circulating Pump Supply"><SelectField value={d.circ_pump_supply} onChange={(v) => set("circ_pump_supply", v)} options={["Yes", "No"]} /></Field>
            {d.circ_pump_supply === "Yes" && (
              <Field label="Number of Pumps">
                <Input className="h-8 text-xs" type="number" min={1} value={d.circ_pump_supply_count || ""} onChange={(e) => set("circ_pump_supply_count", e.target.value)} />
              </Field>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Field label="Circulating Pump Return"><SelectField value={d.circ_pump_return} onChange={(v) => set("circ_pump_return", v)} options={["Yes", "No"]} /></Field>
            {d.circ_pump_return === "Yes" && (
              <Field label="Number of Pumps">
                <Input className="h-8 text-xs" type="number" min={1} value={d.circ_pump_return_count || ""} onChange={(e) => set("circ_pump_return_count", e.target.value)} />
              </Field>
            )}
          </div>


          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Field label="Zoning Controller"><SelectField value={d.zoning_controller} onChange={(v) => set("zoning_controller", v)} options={["Yes", "No"]} /></Field>
            {d.zoning_controller === "Yes" && (
              <Field label="Number of Zones"><Input className="h-8 text-xs" value={d.zone_count || ""} onChange={(e) => set("zone_count", e.target.value)} /></Field>
            )}
            <Field label="Expansion Tank"><SelectField value={d.expansion_tank} onChange={(v) => set("expansion_tank", v)} options={["Yes", "No"]} /></Field>
            <Field label="Indirect Fire Tank"><SelectField value={d.indirect_fire_tank} onChange={(v) => set("indirect_fire_tank", v)} options={["Yes", "No"]} /></Field>
          </div>

          <Field label="Notes / Observations">
            <Textarea className="text-xs min-h-[60px]" value={d.notes || ""} onChange={(e) => set("notes", e.target.value)} />
          </Field>
        </>
      )}


      {system.kind === "rtu" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Field label="Type"><SelectField value={d.type} onChange={(v) => set("type", v)} options={RTU_TYPES} /></Field>
            <Field label="Brand"><Input className="h-8 text-xs" value={d.brand || ""} onChange={(e) => set("brand", e.target.value)} /></Field>
            <Field label="Model #"><Input className="h-8 text-xs" value={d.model_number || ""} onChange={(e) => set("model_number", e.target.value)} /></Field>
            <Field label="Serial #"><Input className="h-8 text-xs" value={d.serial_number || ""} onChange={(e) => set("serial_number", e.target.value)} /></Field>
            <Field label="Tonnage"><SelectField value={d.tonnage} onChange={(v) => set("tonnage", v)} options={RTU_TONNAGE} /></Field>
            <Field label="Voltage"><SelectField value={d.voltage} onChange={(v) => set("voltage", v)} options={VOLTAGE_OPTIONS} /></Field>
            <Field label="Phase"><SelectField value={d.phase} onChange={(v) => set("phase", v)} options={PHASE_OPTIONS} /></Field>
            <Field label="Energy Supply"><SelectField value={d.energy_supply} onChange={(v) => set("energy_supply", v)} options={ENERGY_SUPPLY} /></Field>
            <Field label="Age"><SelectField value={d.age} onChange={(v) => set("age", v)} options={AGE_OPTIONS} /></Field>
            <Field label="Economizer"><SelectField value={d.economizer} onChange={(v) => set("economizer", v)} options={["Yes", "No", "UNKNOWN"]} /></Field>
            <Field label="Filter Size"><Input className="h-8 text-xs" value={d.filter_size || ""} onChange={(e) => set("filter_size", e.target.value)} /></Field>
            <Field label="Thermostat"><SelectField value={d.thermostat} onChange={(v) => set("thermostat", v)} options={THERMOSTAT_OPTIONS} /></Field>
          </div>
          <Field label="Notes / Observations">
            <Textarea className="text-xs min-h-[60px]" value={d.notes || ""} onChange={(e) => set("notes", e.target.value)} />
          </Field>
        </>
      )}

      <div>
        <Label className="text-xs font-semibold">Photos</Label>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-1">
          {FILTER_SIZE_PHOTO_SLOTS.map((s) => (

            <PhotoSlot
              key={s.key}
              profileId={profileId}
              systemId={system.id}
              slotKey={s.key}
              label={boilerLabel(s.label)}

              footer={
                <div className="space-y-2">
                  <Field label="Quantity">
                    <SelectField
                      value={d.filter_quantity}
                      onChange={(v) => set("filter_quantity", v)}
                      options={FILTER_QUANTITY_OPTIONS}
                    />
                  </Field>
                  <Field label="Unit/Equipment ID TAG/NUMBER">
                    <Input
                      className="h-8 text-xs"
                      value={d.filter_equipment_id || ""}
                      onChange={(e) => set("filter_equipment_id", e.target.value)}
                    />
                  </Field>
                  <Field label="Notes/Comments">
                    <Input
                      className="h-8 text-xs"
                      value={d.filter_notes || ""}
                      onChange={(e) => set("filter_notes", e.target.value)}
                    />
                  </Field>
                </div>
              }
            />
          ))}

          {BELT_SIZE_PHOTO_SLOTS.map((s) => (
            <PhotoSlot
              key={s.key}
              profileId={profileId}
              systemId={system.id}
              slotKey={s.key}
              label={boilerLabel(s.label)}

              footer={
                <div className="space-y-2">
                  <Field label="Unit/Equipment ID TAG/NUMBER">
                    <Input
                      className="h-8 text-xs"
                      value={d.belt_equipment_id || ""}
                      onChange={(e) => set("belt_equipment_id", e.target.value)}
                    />
                  </Field>
                  <Field label="Notes/Comments">
                    <Input
                      className="h-8 text-xs"
                      value={d.belt_notes || ""}
                      onChange={(e) => set("belt_notes", e.target.value)}
                    />
                  </Field>
                </div>
              }
            />
          ))}

          {FIELD_DOCUMENTS_PHOTO_SLOTS.map((s) => (
            <PhotoSlot
              key={s.key}
              profileId={profileId}
              systemId={system.id}
              slotKey={s.key}
              label={s.label}
              footer={
                <div className="space-y-2">
                  <Field label="Unit/Equipment ID TAG/NUMBER">
                    <Input
                      className="h-8 text-xs"
                      value={d.field_documents_equipment_id || ""}
                      onChange={(e) => set("field_documents_equipment_id", e.target.value)}
                    />
                  </Field>
                  <Field label="Notes/Comments">
                    <Input
                      className="h-8 text-xs"
                      value={d.field_documents_notes || ""}
                      onChange={(e) => set("field_documents_notes", e.target.value)}
                    />
                  </Field>
                </div>
              }
            />
          ))}

          {(system.kind === "heating" ? HEATING_PHOTO_SLOTS
            : system.kind === "cooling" ? COOLING_PHOTO_SLOTS
            : system.kind === "sump_pump" ? SUMP_PHOTO_SLOTS
            : system.kind === "water_heater" ? WATER_HEATER_PHOTO_SLOTS
            : system.kind === "boiler" ? BOILER_PHOTO_SLOTS
            : system.kind === "rtu" ? RTU_PHOTO_SLOTS
            : EJECTOR_PHOTO_SLOTS
          ).map((s) => (


            <PhotoSlot
              key={s.key}
              profileId={profileId}
              systemId={system.id}
              slotKey={s.key}
              label={s.label}
            />
          ))}
          {(system.kind === "boiler" && (d.circ_pump_supply === "Yes" || d.circ_pump_return === "Yes")) && (
            <PhotoSlot
              profileId={profileId}
              systemId={system.id}
              slotKey="circ_pump_photo"
              label="Circ Pump Photo"
            />
          )}
          <PhotoSlot
            profileId={profileId}
            systemId={system.id}
            slotKey="item_of_concern"
            label="Item of Concern"
            allowCustomTitle
          />
        </div>
      </div>

    </div>
  );
}
