import {useMemo} from 'react';
import type {PoleCase} from '../domain/model.ts';
import {placeholderAssessment} from '../inspection/placeholder.ts';
import type {AnalysisResult} from '../analysis/beam.ts';
import {inspectionCapacity} from '../inspection/capacity.ts';
import {formatForce,formatPoleLength,formatStress,type UnitSystem} from '../domain/units.ts';

export default function TestReadout({pole,z,result=null,units}:{pole:PoleCase;z:number;result?:AnalysisResult|null;units?:UnitSystem}){
 const report=useMemo(()=>placeholderAssessment(pole,z),[pole,z]);
 const capacity=inspectionCapacity(result,pole.bearing);
 const displayUnits=units??pole.unitSystem??'metric';
 return <section className="test-readout" aria-label="Simulated UB1000 assessment">
  <h3>Simulated assessment</h3><p className="test-placeholder">Placeholder results · not an instrument reading</p>
  <dl>
   <div><dt>Assessed fibre strength</dt><dd>{report.fibreStrengthMPa===null?'No fibres':formatStress(report.fibreStrengthMPa,displayUnits,1)}<small>{report.fibreStrength===null?'Unavailable':`${(report.fibreStrength*100).toFixed(1)}% of sound wood`}</small></dd></div>
   <div><dt>Fibre strength capacity reduction</dt><dd>{(report.capacityReduction*100).toFixed(1)}%<small>section area–strength proxy</small></dd></div>
   <div className="test-capacity"><dt>Estimated pole-top capacity</dt><dd>{capacity?formatForce(capacity.capacityKN,displayUnits,displayUnits==='metric'?2:0):'—'}<small>{capacity?`Timber · load toward ${capacity.bearing.toFixed(0)}°`:'Waiting for a valid structural result'}</small></dd></div>
  </dl>
  <div className="test-remaining">Wood remaining <strong>{(report.woodRemaining*100).toFixed(1)}%</strong></div>
  <details><summary>How this placeholder works</summary>
   <p>These teaching values read the known sandbox condition across this section. Fibre strength is the mean remaining-fibre strength relative to sound wood. The reduction compares strength-weighted wood area with a sound section, including cavities as missing wood. It is not bending capacity, RSV, or a UB1000 signal interpretation.</p>
   <p>The displayed strength is the same remaining-fibre factor multiplied by the selected {pole.material.basis==='illustrative'?'illustrative longitudinal tension':'pole bending'} reference ({formatStress(report.soundReferenceMPa,displayUnits,1)}). It is not a measured strength or a calibrated knot failure criterion.</p>
   <p>The pole-top capacity is the existing whole-pole elastic timber bending estimate for the specified load direction. It uses the full pole geometry and known defects, excludes the soil limit, and is independent of the inspection height and probe direction. It is not inferred from the ultrasonic signal or the area–strength proxy. It is not a nonlinear failure or factored design capacity.{capacity&&` The governing timber section is at ${formatPoleLength(capacity.governingHeight,displayUnits)}.`}</p>
   <p>Turning the pair changes the wave simulation above. This separate whole-section strength placeholder does not change with orientation. Manufacturer calibration can replace this calculation later.</p>
  </details>
 </section>;
}
