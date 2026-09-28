export const lessons=[
  {id:'break',title:'Where will it give?',subtitle:'Factors that govern where poles break',duration:'1 min',steps:[
    {title:'A force at the top. A story below.',text:'A horizontal tip load creates bending throughout the pole. This lesson uses ideal groundline restraint to isolate the timber response. Move the section to compare locations.'},
    {title:'Taper changes the balance.',text:'Bending demand grows towards the ground, while the pole also gets thicker. The governing section comes from demand and resistance together.'},
    {title:'A weak region changes the story.',text:'We have introduced an off-centre decayed region. Its location and the remaining wood change the model’s first bending limit.'},
    {title:'Direction matters.',text:'The same defect can respond differently when the load turns. These are beam-model limits, not a simulated fracture.'}]},
  {id:'decay',title:'Hidden changes. Different strength.',subtitle:'How decay influences pole strength',duration:'1 min',steps:[
    {title:'Start with sound wood.',text:'This radiata pine example uses illustrative material values and ideal groundline restraint to isolate timber bending. Its internal condition is prescribed, not measured.'},
    {title:'Decay is not always a hole.',text:'Deterioration can reduce fibre stiffness and strength while material remains. The brown region is weakened timber.'},
    {title:'Location matters as much as size.',text:'Move deterioration towards the outside of the pole. Outer fibres play an important part in resisting bending.'},
    {title:'A hollow is a different condition.',text:'This region now contains no load-bearing wood. Thin-wall buckling and splitting are not assessed by this first beam model.'}]},
  {id:'ub1000',title:'Listen to what is inside.',subtitle:'How UB1000 supports capacity assessment',duration:'1 min',steps:[
    {title:'Begin at an inspection plane.',text:'UB1000 uses ultrasonic acoustic testing. This conceptual animation shows a transverse measurement at the selected plane.'},
    {title:'Transmit. Receive. Interpret.',text:'A pulse crosses the timber. The device examines signal features; time of flight and peak energy are described in InnerView’s public material.'},
    {title:'A measurement is not an exact photograph.',text:'Condition is inferred from observations and calibration. The visible interior here is sandbox truth, not a reconstruction from an actual device.'},
    {title:'Condition contributes to capacity.',text:'Approved measurement-to-strength relationships must be combined with geometry and loading. Product calibration has not been implemented in this prototype.'}]},
  {id:'climb',title:'Before anyone climbs.',subtitle:'Understanding the Safe to Climb workflow',duration:'1 min',steps:[
    {title:'Look beyond the surface.',text:'A pole may look sound outside while its internal condition has changed. An appearance-only check does not establish capacity.'},
    {title:'The work changes the demands.',text:'Climbing introduces additional actions. Their locations, equipment and applicable allowances must follow the approved work procedure.'},
    {title:'Evidence needs a defined decision rule.',text:'Inspection quality, remaining capacity and operational exclusions matter. The official Safe to Climb protocol is needed to demonstrate its actual decisions.'},
    {title:'This is an explanation, not clearance.',text:'No real climbing verdict is issued here. The product-specific thresholds, loads and validated reference cases are still to be supplied.'}]}
] as const;
