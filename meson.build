project('clinic_portal',
  version : '1.0.0'
)

python3 = find_program('python3', 'python', required : true)

# Define test runner
test('portal_tests', python3,
  args : [files('tests/test_portal.py')],
  workdir : meson.current_source_dir()
)
