// quiz_data.js - lightweight subject registry, counts, and constants
// Question banks are lazy loaded from subject_data/*.js.

const SEMESTERS = {
  sem1: {
    id: 'sem1',
    label: 'Semester 1',
    active: true,
    hasDepartments: false,
    departments: null,
  },
  sem2: {
    id: 'sem2',
    label: 'Semester 2',
    active: true,
    hasDepartments: true,
    departments: {
      civil: { id: 'civil', label: 'Civil Engineering' },
      mechanical: { id: 'mechanical', label: 'Mechanical Engineering' },
      eee: { id: 'eee', label: 'Electrical & Electronic Engineering' },
    },
  },
};

const SUBJECT_COUNTS = {
  "materials": {
    "pastUnit": {
      "count": 251,
      "placeholder": []
    },
    "pastPaper": {
      "count": 0,
      "placeholder": []
    },
    "targetHard": {
      "count": 40,
      "placeholder": []
    },
    "targetNormal": {
      "count": 170,
      "placeholder": []
    },
    "allTarget": {
      "count": 210,
      "placeholder": []
    }
  },
  "mechanics": {
    "pastUnit": {
      "count": 0,
      "placeholder": []
    },
    "pastPaper": {
      "count": 78,
      "placeholder": []
    },
    "targetHard": {
      "count": 0,
      "placeholder": []
    },
    "targetNormal": {
      "count": 0,
      "placeholder": []
    },
    "allTarget": {
      "count": 0,
      "placeholder": []
    }
  },
  "fluid": {
    "pastUnit": {
      "count": 0,
      "placeholder": []
    },
    "pastPaper": {
      "count": 150,
      "placeholder": []
    },
    "targetHard": {
      "count": 0,
      "placeholder": []
    },
    "targetNormal": {
      "count": 0,
      "placeholder": []
    },
    "allTarget": {
      "count": 0,
      "placeholder": []
    }
  },
  "cs": {
    "pastUnit": {
      "count": 0,
      "placeholder": []
    },
    "pastPaper": {
      "count": 750,
      "placeholder": []
    },
    "targetHard": {
      "count": 0,
      "placeholder": []
    },
    "targetNormal": {
      "count": 0,
      "placeholder": []
    },
    "allTarget": {
      "count": 0,
      "placeholder": []
    }
  },
  "math": {
    "pastUnit": {
      "count": 0,
      "placeholder": []
    },
    "pastPaper": {
      "count": 151,
      "placeholder": []
    },
    "targetHard": {
      "count": 0,
      "placeholder": []
    },
    "targetNormal": {
      "count": 0,
      "placeholder": []
    },
    "allTarget": {
      "count": 0,
      "placeholder": []
    }
  }
};

const SUBJECTS = {
  materials: {
    key: 'materials',
    label: 'Materials Science',
    semesterId: 'sem1',
    departmentIds: ['all'],
    icon: '⚗️',
    color: '#6c8bef',
    colorBg: '#1a2040',
    desc: 'Bonding, crystal structures & mechanical properties',
    pastUnit: SUBJECT_COUNTS.materials.pastUnit.placeholder,
    pastPaper: SUBJECT_COUNTS.materials.pastPaper.placeholder,
    targetHard: SUBJECT_COUNTS.materials.targetHard.placeholder,
    targetNormal: SUBJECT_COUNTS.materials.targetNormal.placeholder,
    allTarget: SUBJECT_COUNTS.materials.allTarget.placeholder,
    units: {1:'Atomic Bonding', 2:'Crystal Structure', 3:'Mechanical Properties', 4:'Degradation', 5:'Selection of Materials', 6:'Electrical Properties', 7:'Nanotechnology', 8:'Functional Properties'},
    unitColors: ['unit1','unit2','unit3','unit4','unit5','unit6','unit7','unit8'],
    hideEmptyPastUnits: true,
    historyKey: 'msq_history_materials',
    progressKeyPastUnit: 'msq_progress_unit_materials',
    progressKeyPastPaper: 'msq_progress_paper_materials',
    progressKeyTarget: 'msq_target_progress_materials',
  },
  mechanics: {
    key: 'mechanics',
    label: 'Mechanics',
    semesterId: 'sem1',
    departmentIds: ['all'],
    icon: '⚙️',
    color: '#4ade80',
    colorBg: '#0d2b1a',
    desc: 'Statics, dynamics, kinematics & structural mechanics',
    pastUnit: SUBJECT_COUNTS.mechanics.pastUnit.placeholder,
    pastPaper: SUBJECT_COUNTS.mechanics.pastPaper.placeholder,
    targetHard: SUBJECT_COUNTS.mechanics.targetHard.placeholder,
    targetNormal: SUBJECT_COUNTS.mechanics.targetNormal.placeholder,
    allTarget: SUBJECT_COUNTS.mechanics.allTarget.placeholder,
    units: {1:'Kinematics & Dynamics', 2:'Forces & Energy', 3:'Structures & Rotation'},
    unitColors: ['unit1','unit2','unit3'],
    historyKey: 'msq_history_mechanics',
    progressKeyPastUnit: 'msq_progress_unit_mechanics',
    progressKeyPastPaper: 'msq_progress_paper_mechanics',
    progressKeyTarget: 'msq_target_progress_mechanics',
  },
  fluid: {
    key: 'fluid',
    label: 'Fluid Mechanics',
    semesterId: 'sem1',
    departmentIds: ['all'],
    icon: '💧',
    color: '#38bdf8',
    colorBg: '#0c1f2e',
    desc: 'Fluid statics, dynamics, viscosity & pipe flow',
    pastUnit: SUBJECT_COUNTS.fluid.pastUnit.placeholder,
    pastPaper: SUBJECT_COUNTS.fluid.pastPaper.placeholder,
    targetHard: SUBJECT_COUNTS.fluid.targetHard.placeholder,
    targetNormal: SUBJECT_COUNTS.fluid.targetNormal.placeholder,
    allTarget: SUBJECT_COUNTS.fluid.allTarget.placeholder,
    units: {1:'Fluid Properties & Flow Types', 2:'Hydrostatics & Pressure', 3:'Viscous & Pipe Flow'},
    unitColors: ['unit1','unit2','unit3'],
    historyKey: 'msq_history_fluid',
    progressKeyPastUnit: 'msq_progress_unit_fluid',
    progressKeyPastPaper: 'msq_progress_paper_fluid',
    progressKeyTarget: 'msq_target_progress_fluid',
  },
  cs: {
    key: 'cs',
    label: 'Computer Science',
    semesterId: 'sem1',
    departmentIds: ['all'],
    icon: '💻',
    color: '#f59e0b',
    colorBg: '#2b1e05',
    desc: 'Algorithms, data structures, logic & systems',
    pastUnit: SUBJECT_COUNTS.cs.pastUnit.placeholder,
    pastPaper: SUBJECT_COUNTS.cs.pastPaper.placeholder,
    targetHard: SUBJECT_COUNTS.cs.targetHard.placeholder,
    targetNormal: SUBJECT_COUNTS.cs.targetNormal.placeholder,
    allTarget: SUBJECT_COUNTS.cs.allTarget.placeholder,
    units: {1:'Number Systems & Networks', 2:'Algorithms & Data Structures', 3:'Logic & Digital Systems'},
    unitColors: ['unit1','unit2','unit3'],
    historyKey: 'msq_history_cs',
    progressKeyPastUnit: 'msq_progress_unit_cs',
    progressKeyPastPaper: 'msq_progress_paper_cs',
    progressKeyTarget: 'msq_target_progress_cs',
  },
  math: {
    key: 'math',
    label: 'Mathematics',
    semesterId: 'sem1',
    departmentIds: ['all'],
    icon: '📐',
    color: '#a78bfa',
    colorBg: '#1a1040',
    desc: 'MA1014 · Real Analysis, ODEs, Riemann Integration, Vectors, Matrices & Complex Numbers',
    pastUnit: SUBJECT_COUNTS.math.pastUnit.placeholder,
    pastPaper: SUBJECT_COUNTS.math.pastPaper.placeholder,
    targetHard: SUBJECT_COUNTS.math.targetHard.placeholder,
    targetNormal: SUBJECT_COUNTS.math.targetNormal.placeholder,
    allTarget: SUBJECT_COUNTS.math.allTarget.placeholder,
    units: {1:'Real Analysis', 2:'ODEs', 3:'Riemann Integration', 4:'Vectors', 5:'Matrices', 6:'Complex Numbers'},
    unitColors: ['unit1','unit2','unit3','unit4','unit5','unit6'],
    historyKey: 'msq_history_math',
    progressKeyPastUnit: 'msq_progress_unit_math',
    progressKeyPastPaper: 'msq_progress_paper_math',
    progressKeyTarget: 'msq_target_progress_math',
  },
};

function getSemesters() {
  return Object.values(SEMESTERS)
    .map((semester, index) => ({ semester, index }))
    .sort((a, b) => {
      if (Boolean(a.semester.active) !== Boolean(b.semester.active)) {
        return a.semester.active ? -1 : 1;
      }
      return a.index - b.index;
    })
    .map(entry => entry.semester);
}

function getDepartments(semesterId) {
  const semester = SEMESTERS[semesterId];
  if (!semester || !semester.hasDepartments) return null;
  return Object.values(semester.departments || {});
}

function getModules(semesterId, departmentId) {
  const semester = SEMESTERS[semesterId];
  if (!semester) return [];

  return Object.values(SUBJECTS).filter(subject => {
    if (subject.semesterId !== semesterId) return false;
    if (!semester.hasDepartments) return true;

    const departmentIds = Array.isArray(subject.departmentIds) ? subject.departmentIds : [];
    return departmentIds.includes('all') || Boolean(departmentId && departmentIds.includes(departmentId));
  });
}

function isArchived(semesterId) {
  const semester = SEMESTERS[semesterId];
  return Boolean(semester && !semester.active);
}

const letters = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];

