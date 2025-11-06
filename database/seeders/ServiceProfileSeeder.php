<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ServiceProfile;
use App\Enums\ServiceCodeEnum;

class ServiceProfileSeeder extends Seeder
{
    public function run(): void
    {
        $services = [
            ['code' => 'DPRKPCK', 'name' => 'Dinas Perumahan Rakyat, Kawasan Permukiman dan Cipta Karya',
                'web' => 'https://dprkpck.jatimprov.go.id/', 'email' => 'dprkpck@jatimprov.go.id',
                'phone' => '(031) 8287275'
            ],
            ['code' => 'DPUBM', 'name' => 'Dinas Pekerjaan Umum Bina Marga',
                'web' => 'https://binamarga.jatimprov.go.id/', 'email' => 'binamarga@jatimprov.go.id',
                'phone' => '(031) 8290186'
            ],
            ['code' => 'DPUSDA', 'name' => 'Dinas Pekerjaan Umum Sumber Daya Air',
                'web' => 'https://dpuair.jatimprov.go.id/', 'email' => 'info@pusda-jatim.go.id',
                'phone' => '(031) 8292419'
            ],
            ['code' => 'DLH', 'name' => 'Dinas Lingkungan Hidup',
                'web' => 'https://dlh.jatimprov.go.id/', 'email' => 'dlh@jatimprov.go.id',
                'phone' => '(031) 8543852'
            ],
            ['code' => 'DINSOS', 'name' => 'Dinas Sosial',
                'web' => 'https://dinsos.jatimprov.go.id/', 'email' => 'dinsosjatim56b@gmail.com',
                'phone' => '(031) 8290794'
            ],
            ['code' => 'BPBD', 'name' => 'Badan Penanggulangan Bencana Daerah',
                'web' => 'https://web.bpbd.jatimprov.go.id/', 'email' => null,
                'phone' => '+62 812-3178-0000'
            ],
            ['code' => 'DISHUB', 'name' => 'Dinas Perhubungan',
                'web' => 'https://dishub.jatimprov.go.id/', 'email' => 'dishub@jatimprov.go.id',
                'phone' => '(031) 8292276'
            ],
            ['code' => 'DINKES', 'name' => 'Dinas Kesehatan',
                'web' => 'https://dinkes.jatimprov.go.id/', 'email' => null,
                'phone' => '(031) 8290481'
            ],
            ['code' => 'SATPOLPP', 'name' => 'Satuan Polisi Pamong Praja',
                'web' => 'https://satpolpp.jatimprov.go.id/', 'email' => 'jks.satpolpp@jatimprov.go.id',
                'phone' => '+62 811-3516-499'
            ],
            ['code' => 'DISKOMINFO', 'name' => 'Dinas Komunikasi dan Informatika',
                'web' => 'https://kominfo.jatimprov.go.id/', 'email' => 'kominfo@jatimprov.go.id',
                'phone' => '(031) 8294608'
            ],
            ['code' => 'DISNAKERTRANS', 'name' => 'Dinas Tenaga Kerja dan Transmigrasi',
                'web' => 'https://disnakertrans.jatimprov.go.id/', 'email' => 'disnakertrans@jatimprov.go.id',
                'phone' => '(031) 8280254'
            ],
            ['code' => 'DIPERTAKP', 'name' => 'Dinas Pertanian dan Ketahanan Pangan',
                'web' => 'https://pertanian.jatimprov.go.id/', 'email' => 'pertanian@jatimprov.go.id',
                'phone' => null
            ],
            ['code' => 'DISNAK', 'name' => 'Dinas Peternakan',
                'web' => 'https://disnak.jatimprov.go.id/', 'email' => 'disnak@jatimprov.go.id',
                'phone' => '(031) 8292545'
            ],
            ['code' => 'DKP', 'name' => 'Dinas Kelautan dan Perikanan',
                'web' => 'https://dkp.jatimprov.go.id/', 'email' => 'diskanla@jatimprov.go.id',
                'phone' => '(031) 8281672'
            ],
            ['code' => 'DINDIK', 'name' => 'Dinas Pendidikan',
                'web' => 'https://dindik.jatimprov.go.id/', 'email' => 'dindik@jatimprov.go.id',
                'phone' => '(031) 5342706'
            ],
            ['code' => 'DISBUDPAR', 'name' => 'Dinas Kebudayaan dan Pariwisata',
                'web' => 'https://disbudpar.jatimprov.go.id/', 'email' => 'disbudpar@jatimprov.go.id',
                'phone' => '(031) 8531816'
            ],
            ['code' => 'DISPERINDAG', 'name' => 'Dinas Perindustrian dan Perdagangan',
                'web' => 'https://disperindag.jatimprov.go.id/', 'email' => 'disperindag@jatimprov.go.id',
                'phone' => '(031) 8499895'
            ],
            ['code' => 'DPMPTSP', 'name' => 'Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu',
                'web' => 'https://dpmptsp.jatimprov.go.id/', 'email' => 'dpmptsp@jatimprov.go.id',
                'phone' => '(031) 35967047'
            ],
            ['code' => 'DISKOPUKM', 'name' => 'Dinas Koperasi, Usaha Kecil dan Menengah',
                'web' => 'https://diskopukm.jatimprov.go.id/', 'email' => 'diskopukm@jatimprov.go.id',
                'phone' => '(031) 8676645'
            ],
            ['code' => 'DISPORA', 'name' => 'Dinas Kepemudaan dan Olahraga',
                'web' => 'https://dispora.jatimprov.go.id/', 'email' => 'dispora@jatimprov.go.id',
                'phone' => '(031) 5345508'
            ],
            ['code' => 'DISPERPUSIP', 'name' => 'Dinas Perpustakaan dan Kearsipan',
                'web' => 'https://disperpusip.jatimprov.go.id/', 'email' => 'disperpusip@jatimprov.go.id',
                'phone' => '(031) 5947830'
            ],
            ['code' => 'BAPPEDA', 'name' => 'Badan Perencanaan Pembangunan Daerah',
                'web' => 'https://bappeda.jatimprov.go.id/', 'email' => 'ppid.bappedajatim@gmail.com',
                'phone' => '(031) 3554851'
            ],
            ['code' => 'BAPENDA', 'name' => 'Badan Pajak dan Pendapatan Daerah',
                'web' => 'https://bapenda.jatimprov.go.id/', 'email' => 'cs@bapenda.jatimprov.go.id',
                'phone' => '(031) 5947953'
            ],
            ['code' => 'DP3AK', 'name' => 'Dinas Pemberdayaan Perempuan, Perlindungan Anak dan Kependudukan',
                'web' => 'https://dp3ak.jatimprov.go.id/', 'email' => 'dp3ak@jatimprov.go.id',
                'phone' => '(031) 99842251'
            ],
        ];

        foreach ($services as $service) {
            ServiceProfile::updateOrCreate(
                ['code' => ServiceCodeEnum::from($service['code'])
            ],
                [
                    'full_name' => $service['name'],
                    'website' => $service['web'],
                    'email' => $service['email'],
                    'phone' => $service['phone'],
                ]
            );
        }
    }
}