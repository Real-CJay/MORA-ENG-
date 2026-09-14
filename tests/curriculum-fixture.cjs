// Synthetic metadata and question identities only. No real bank imports.
function subjects(){return Object.fromEntries(['materials','mechanics','fluid','math'].map(key=>[key,{
  key,label:'Synthetic '+key,desc:'Synthetic fixture',semesterId:'sem1',departmentIds:['all'],
  color:'#6c8bef',icon:'📘',units:{1:'Synthetic unit'},pastUnit:[{id:'__dev_synthetic_curriculum_'+key}],pastPaper:[],allTarget:[]
}]));}
function snapshot(revision=1){
  const row=(id,label)=>({id,label,status:'published',sort_order:0});
  return {schemaVersion:1,visibility:'published',revision,
    semesters:[{...row('sem1','Synthetic common semester'),kind:'common'},{...row('sem2','Synthetic departmental semester'),kind:'departmental'}],
    departments:[{...row('mechanical','Mechanical'),semester_id:'sem2'},{...row('civil','Civil'),semester_id:'sem2'}],
    streams:[{...row('mechatronics','Mechatronics'),department_id:'mechanical'}],
    modules:[...Object.keys(subjects()).map(id=>({...row(id,'Synthetic '+id),description:'Synthetic fixture',color:'#6c8bef',icon:'book',content_kind:'bundled'})),
      {...row('empty','Empty module'),description:'No content yet',color:'#6c8bef',icon:'book',content_kind:'none'}],
    placements:[...Object.keys(subjects()).map(id=>({...row('sem1_'+id,''),module_id:id,semester_id:'sem1',department_id:null,stream_id:null})),
      {...row('shared_math',''),module_id:'math',semester_id:'sem2',department_id:'mechanical',stream_id:'mechatronics'},
      {...row('empty_module',''),module_id:'empty',semester_id:'sem1',department_id:null,stream_id:null}]
  };
}
module.exports={subjects,snapshot};
