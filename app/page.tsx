// @ts-nocheck
'use client';

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://yfzymtrapibbjytzcuee.supabase.co";
const supabaseKey = "sb_publishable_RBfBuWmFt-tCRjm9glgYVg_xX6JT-Yl";

const supabase = createClient(supabaseUrl, supabaseKey);

const teachers = [
"Yeye","Jason","Art","Pau","Niah","Via","Jarea","Clyde","CJ","Alex","Nelle","Joseph","Chin","Todd"
];

const days = [
{label:"Sunday",value:0},
{label:"Monday",value:1},
{label:"Tuesday",value:2},
{label:"Wednesday",value:3},
{label:"Thursday",value:4},
{label:"Friday",value:5},
{label:"Saturday",value:6}
];

const packages = {
Silver:4,
Gold:8,
Platinum:12
};

function countLessonDaysMultiple(startDate,lessonDays){

if(!startDate) return 0

const start = new Date(startDate)
const today = new Date()

let count = 0
const d = new Date(start)

while(d <= today){

if(lessonDays.includes(d.getDay())) count++

d.setDate(d.getDate()+1)

}

return count

}

export default function FirstBeatAdminPortal(){

const resetWeeklyPayroll = async () => {

const confirmReset = window.confirm(
"Close this week's payroll and reset for next week?"
)

if(!confirmReset) return

const today = new Date().toISOString().split("T")[0]

await supabase
.from("students")
.update({ payrollResetDate: today })
.neq("id", 0)

alert("Weekly payroll has been reset.")

loadStudents()

}


const [students,setStudents] = useState([])
const [search,setSearch] = useState("")

const [newStudent,setNewStudent] = useState("")
const [instrument,setInstrument] = useState("")
const [teacher,setTeacher] = useState("")
const [pkg,setPkg] = useState("Silver")
const [lessonDays,setLessonDays] = useState([6])
const [paymentAmount,setPaymentAmount] = useState("")
const [paymentDate,setPaymentDate] = useState("")
const [editingId,setEditingId] = useState(null)

const toggleDay = (day)=>{

if(lessonDays.includes(day)){
setLessonDays(lessonDays.filter(d=>d!==day))
}else{
setLessonDays([...lessonDays,day])
}

}

const loadStudents = async ()=>{

const {data} = await supabase
.from("students")
.select("*")

if(data) setStudents(data)

}

useEffect(()=>{
loadStudents()
},[])

const addStudent = async ()=>{

if(!newStudent){
alert("Enter student name")
return
}

const history = paymentAmount ? [{
date:paymentDate,
amount:Number(paymentAmount)
}] : []

const newEntry={
name:newStudent,
instrument:instrument || "TBD",
teacher:teacher,
package:pkg,
lessonDays:lessonDays,
paymentAmount:paymentAmount ? Number(paymentAmount) : 0,
paymentDate:paymentDate || null,
paymentHistory:history,
absences:0
}

await supabase.from("students").insert([newEntry])

resetForm()
loadStudents()

}

const updateStudent = async(id)=>{

await supabase
.from("students")
.update({
name:newStudent,
instrument:instrument,
teacher:teacher,
package:pkg,
lessonDays:lessonDays
})
.eq("id",id)

resetForm()
loadStudents()

}

const resetForm = ()=>{
setEditingId(null)
setNewStudent("")
setInstrument("")
setTeacher("")
setPkg("Silver")
setPaymentAmount("")
setPaymentDate("")
setLessonDays([6])
}

const renewPayment = async(s)=>{

const today = new Date().toISOString().split("T")[0]

const history = s.paymentHistory || []

history.push({
date:today,
amount:2500
})

await supabase
.from("students")
.update({
paymentDate:today,
paymentAmount:Number(s.paymentAmount || 0)+2500,
paymentHistory:history,
absences:0
})
.eq("id",s.id)

loadStudents()

}

const undoRenew = async(s)=>{

const history = [...(s.paymentHistory || [])]

if(history.length > 0){
history.pop()
}

await supabase
.from("students")
.update({
paymentAmount:Math.max((s.paymentAmount || 0)-2500,0),
paymentHistory:history
})
.eq("id",s.id)

loadStudents()

}

const deleteStudent = async(id)=>{

await supabase
.from("students")
.delete()
.eq("id",id)

loadStudents()

}

const markAbsent = async(s)=>{

await supabase
.from("students")
.update({
absences:(s.absences || 0)+1
})
.eq("id",s.id)

loadStudents()

}

const undoAbsent = async(s)=>{

const newAbsence = Math.max((s.absences || 0)-1,0)

await supabase
.from("students")
.update({
absences:newAbsence
})
.eq("id",s.id)

loadStudents()

}

const totalIncome = students.reduce(
(sum,s)=> sum + Number(s.paymentAmount || 0),0
)

const teacherLessons = students.reduce((sum,s)=>{

const studentDays = s.lessonDays || [s.lessonDay]

const usedLessons = Math.max(
0,
countLessonDaysMultiple(s.paymentDate,studentDays)-(s.absences||0)
)

return sum + usedLessons

},0)

const teacherPayrollTotal = teacherLessons * 250
const studioNet = totalIncome - teacherPayrollTotal

const teacherPayroll = {}

students.forEach(s=>{

const studentDays = s.lessonDays || [s.lessonDay]

const usedLessons = Math.max(
0,
countLessonDaysMultiple(
s.payrollResetDate || s.paymentDate,
studentDays
) - (s.absences || 0)
)

const t = s.teacher || "No Teacher"

if(!teacherPayroll[t]) teacherPayroll[t] = 0

teacherPayroll[t] += usedLessons * 250

})

const today = new Date().getDay()

const todaysStudents = students.filter(s=>{
const studentDays = s.lessonDays || [s.lessonDay]
return studentDays.includes(today)
})

const todaysByTeacher = {}

todaysStudents.forEach(s=>{
const t = s.teacher || "No Teacher"
if(!todaysByTeacher[t]) todaysByTeacher[t] = []
todaysByTeacher[t].push(s)
})

const sortedStudents = [...students]
.filter(s =>
s.name.toLowerCase().includes(search.toLowerCase())
)
.sort((a,b)=> a.name.localeCompare(b.name))

return(

<div className="p-6 grid gap-6">

<h1 className="text-3xl font-bold">
First Beat Music Studio – Admin Portal
</h1>

{/* DASHBOARD */}

<div className="grid grid-cols-1 md:grid-cols-6 gap-4">

<div className="p-4 border rounded-2xl shadow">
<p>Total Students</p>
<p className="text-xl font-bold">{students.length}</p>
</div>

<div className="p-4 border rounded-2xl shadow">
<p>Total Income</p>
<p className="text-xl font-bold">₱{totalIncome}</p>
</div>

<div className="p-4 border rounded-2xl shadow">
<p>Teacher Payroll</p>
<p className="text-xl font-bold">₱{teacherPayrollTotal}</p>
</div>

<div className="p-4 border rounded-2xl shadow">
<p>Studio Net</p>
<p className="text-xl font-bold">₱{studioNet}</p>
</div>

<div className="p-4 border rounded-2xl shadow">
<p>Today's Lessons</p>
<p className="text-xl font-bold">{todaysStudents.length}</p>
</div>

</div>

{/* TEACHER PAYROLL PER TEACHER */}

<div className="border rounded-2xl shadow p-4">

<div className="flex justify-between items-center mb-4">

<h2 className="text-xl font-semibold">
Teacher Payroll per Teacher
</h2>

<button
className="bg-red-600 text-white px-3 py-1 rounded"
onClick={resetWeeklyPayroll}
>
Reset Weekly Payroll
</button>

</div>

{Object.entries(teacherPayroll).map(([t,amount])=>(
<p key={t}>{t} — ₱{amount}</p>
))}

</div>
{/* TODAY'S LESSONS */}

<div className="border rounded-2xl shadow p-4">

<h2 className="text-xl font-semibold mb-4">
Today's Lessons by Teacher
</h2>

{Object.entries(todaysByTeacher).map(([teacherName,students])=>(

<div key={teacherName} className="mb-4">

<p className="font-bold">{teacherName}</p>

{students.map(s=>(
<p key={s.id}>• {s.name}</p>
))}

</div>

))}

</div>

{/* ADD / EDIT STUDENT */}

<div className="border rounded-2xl shadow p-4">

<h2 className="text-xl font-semibold mb-4">
{editingId ? "Edit Student" : "Add Student"}
</h2>

<div className="grid md:grid-cols-3 gap-3">

<input
className="border p-2 rounded"
placeholder="Student Name"
value={newStudent}
onChange={(e)=>setNewStudent(e.target.value)}
/>

<input
className="border p-2 rounded"
placeholder="Instrument"
value={instrument}
onChange={(e)=>setInstrument(e.target.value)}
/>

<select
className="border p-2 rounded"
value={teacher}
onChange={(e)=>setTeacher(e.target.value)}
>
<option value="">Teacher</option>
{teachers.map(t=>(
<option key={t}>{t}</option>
))}
</select>

<select
className="border p-2 rounded"
value={pkg}
onChange={(e)=>setPkg(e.target.value)}
>
<option>Silver</option>
<option>Gold</option>
<option>Platinum</option>
</select>

<input
className="border p-2 rounded"
type="number"
placeholder="Payment Amount"
value={paymentAmount}
onChange={(e)=>setPaymentAmount(e.target.value)}
/>

<input
className="border p-2 rounded"
type="date"
value={paymentDate}
onChange={(e)=>setPaymentDate(e.target.value)}
/>

</div>

<div className="flex gap-2 mt-3 flex-wrap">

{days.map(d=>(
<button
key={d.value}
className={`px-3 py-1 border rounded ${
lessonDays.includes(d.value) ? "bg-blue-500 text-white" : ""
}`}
onClick={()=>toggleDay(d.value)}
>
{d.label}
</button>
))}

</div>

<button
className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
onClick={()=> editingId ? updateStudent(editingId) : addStudent()}
>
{editingId ? "Update Student" : "Add Student"}
</button>

</div>

{/* SEARCH */}

<div className="border rounded-2xl shadow p-4">

<input
className="border p-2 rounded w-full"
placeholder="Search student..."
value={search}
onChange={(e)=>setSearch(e.target.value)}
/>

</div>

{/* STUDENT LIST */}

<div className="border rounded-2xl shadow p-4">

<div className="space-y-4">

{sortedStudents.map((s)=>{

const studentDays = s.lessonDays || [s.lessonDay]

const usedLessons = Math.max(
0,
countLessonDaysMultiple(s.paymentDate,studentDays)-(s.absences||0)
)

const limit = packages[s.package || "Silver"]
const lessonsLeft = Math.max(0,limit-usedLessons)

return(

<div key={s.id} className="p-3 border rounded-xl">

<p className="font-medium">{s.name}</p>

<p className="text-sm text-gray-500">
Teacher: {s.teacher}
</p>

<p className="text-sm">
Instrument: {s.instrument || "TBD"}
</p>

<p className="text-sm">
Package: {s.package}
</p>

<p className="text-sm">
Lesson Days: {(s.lessonDays || []).map(d=>days.find(x=>x.value===d)?.label).join(", ")}
</p>

<p className="text-sm">
Lessons Left: {lessonsLeft}
</p>

<p className="text-sm">
Absences: {s.absences || 0}
</p>

{lessonsLeft === 0 && (
<p className="text-red-600 text-sm font-semibold">
⚠ PAYMENT DUE
</p>
)}

{s.paymentHistory?.length > 0 && (

<div className="text-sm mt-2">

<p className="font-semibold">Payment History</p>

{s.paymentHistory.slice().reverse().map((p,i)=>(
<p key={i}>{p.date} — ₱{p.amount}</p>
))}

</div>

)}

<div className="flex gap-2 mt-2 flex-wrap">

<button
className="px-3 py-1 text-sm border rounded"
onClick={()=>markAbsent(s)}
>
Absent
</button>

<button
className="px-3 py-1 text-sm border rounded"
onClick={()=>undoAbsent(s)}
>
Undo Absent
</button>

<button
className="px-3 py-1 text-sm bg-green-600 text-white rounded"
onClick={()=>renewPayment(s)}
>
Renew
</button>

<button
className="px-3 py-1 text-sm border rounded"
onClick={()=>undoRenew(s)}
>
Undo Renew
</button>

<button
className="px-3 py-1 text-sm bg-blue-600 text-white rounded"
onClick={()=>{

setEditingId(s.id)
setNewStudent(s.name)
setInstrument(s.instrument)
setTeacher(s.teacher)
setPkg(s.package)
setLessonDays(s.lessonDays || [6])

}}
>
Edit
</button>

<button
className="px-3 py-1 text-sm bg-red-500 text-white rounded"
onClick={()=>deleteStudent(s.id)}
>
Delete
</button>

</div>

</div>

)

})}

</div>

</div>

</div>

)

}