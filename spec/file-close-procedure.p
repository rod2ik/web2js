program TEST;

type
    fileType = packed file of char;

procedure fileClose(var f: fileType);
begin
    close(f);
end;

begin
end.
