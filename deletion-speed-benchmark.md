# Unix

## Directorio grande

- Ficheros: 277866
- Tamaño: 4,35GB

### Benchmark implementado

- Método clásico (v0.12.2 - rm -rf): 9,90s
- Rsync: 14,82s
- Perl: 17,47s
- Find: 18,23s
- Rm-rf: 8,94s

### Benchmark directo

```
❯ mkdir /tmp/empty
❯ time rsync -a --delete "/tmp/empty/" "node_modules2/"
0.87s user 10.95s system 56% cpu 20.922 total

❯ time rm -rf node_modules3
0.31s user 9.63s system 78% cpu 12.619 total

❯ time perl -e 'use File::Path qw(remove_tree); remove_tree("node_modules", {verbose => 0, safe => 0});'
4.69s user 13.36s system 78% cpu 22.895 total
```

## Directorio pequeño

- Ficheros: 92622
- Tamaño: 1,50GB

### Benchmark directo

```
❯ time rsync -a --delete "/tmp/empty/" "node_modules/"
0.20s user 3.10s system 95% cpu 3.444 total

❯ time rsync -a --delete --ignore-errors --whole-file --inplace --remove-source-files /tmp/empty/ node_modules/
0.22s user 3.12s system 95% cpu 3.502 total

❯ time rm -rf node_modules
0.13s user 3.03s system 95% cpu 3.321 total
```
