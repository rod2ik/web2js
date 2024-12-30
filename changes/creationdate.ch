@x
  othercases print_esc("jobname")
@y
  creationdate_code: print_esc("creationdate");
  othercases print_esc("jobname")
@z

@x Just make sure this is defined.  This is certainly not doing the right thing though.
job_name_code: if job_name=0 then open_log_file;
@y
creationdate_code: cur_val:=sys_time;
job_name_code: if job_name=0 then open_log_file;
@z

@x
@* \[54] System-dependent changes.
@y
@* \[53x] creationdate

@<Generate all \eTeX...@>=
primitive("creationdate",convert,creationdate_code);@/
@!@:creationdate_}{\.{\\creationdate} primitive@>

@* \[54] System-dependent changes.
@z
