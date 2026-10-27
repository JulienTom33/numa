alter table public.messages
  add constraint messages_content_length_check
  check (char_length(content) between 1 and 20000);

alter table public.birth_data
  add constraint birth_data_latitude_range check (latitude between -90 and 90),
  add constraint birth_data_longitude_range check (longitude between -180 and 180),
  add constraint birth_data_birth_place_length check (char_length(birth_place) between 1 and 200),
  add constraint birth_data_timezone_length check (char_length(timezone) between 1 and 64);
