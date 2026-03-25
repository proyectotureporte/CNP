import { defineType, defineField } from 'sanity'

export const registroPeritusSchema = defineType({
  name: 'registroPeritus',
  title: 'Registro Peritus',
  type: 'document',
  fields: [
    defineField({
      name: 'peritusId',
      title: 'ID Peritus',
      type: 'string',
      readOnly: true,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'nombreApellido',
      title: 'Nombre y Apellido',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'cedula',
      title: 'Cédula',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'correo',
      title: 'Correo Electrónico',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'celular',
      title: 'Celular',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'ciudad',
      title: 'Ciudad',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'profesionOficio',
      title: 'Profesión u Oficio',
      type: 'string',
      options: {
        list: [
          { title: 'Contador Público', value: 'Contador Público' },
          { title: 'Abogado', value: 'Abogado' },
          { title: 'Ingeniero', value: 'Ingeniero' },
          { title: 'Médico', value: 'Médico' },
          { title: 'Arquitecto', value: 'Arquitecto' },
          { title: 'Economista', value: 'Economista' },
          { title: 'Psicólogo', value: 'Psicólogo' },
          { title: 'Administrador', value: 'Administrador' },
          { title: 'Perito en Informática', value: 'Perito en Informática' },
          { title: 'Perito en Grafología', value: 'Perito en Grafología' },
          { title: 'Otro', value: 'Otro' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'cargo',
      title: 'Cargo',
      type: 'string',
      options: {
        list: [
          { title: 'Perito', value: 'Perito' },
          { title: 'Consultor', value: 'Consultor' },
          { title: 'Asesor', value: 'Asesor' },
          { title: 'Director', value: 'Director' },
          { title: 'Coordinador', value: 'Coordinador' },
          { title: 'Analista', value: 'Analista' },
          { title: 'Independiente', value: 'Independiente' },
          { title: 'Otro', value: 'Otro' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'experiencia',
      title: 'Años de Experiencia',
      type: 'string',
      options: {
        list: [
          { title: '0-1 años', value: '0-1' },
          { title: '2-5 años', value: '2-5' },
          { title: '6-10 años', value: '6-10' },
          { title: '11-15 años', value: '11-15' },
          { title: '16-20 años', value: '16-20' },
          { title: 'Más de 20 años', value: '20+' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'especialidad',
      title: 'Especialidad',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'edad',
      title: 'Edad',
      type: 'string',
      options: {
        list: [
          { title: '18-25 años', value: '18-25' },
          { title: '26-35 años', value: '26-35' },
          { title: '36-45 años', value: '36-45' },
          { title: '46-55 años', value: '46-55' },
          { title: '56-65 años', value: '56-65' },
          { title: 'Más de 65 años', value: '65+' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'hojaDeVida',
      title: 'Hoja de Vida',
      type: 'file',
      options: {
        accept: '.pdf,.doc,.docx',
      },
    }),
    defineField({
      name: 'clientRef',
      title: 'Cliente CRM Asociado',
      type: 'reference',
      to: [{ type: 'crmClient' }],
      readOnly: true,
    }),
    defineField({
      name: 'fechaRegistro',
      title: 'Fecha de Registro',
      type: 'datetime',
      readOnly: true,
    }),
    defineField({
      name: 'estadoDocumentacion',
      title: 'Estado',
      type: 'string',
      options: {
        list: [
          { title: 'Pendiente', value: 'pendiente' },
          { title: 'En Revisión', value: 'revision' },
          { title: 'Aprobado', value: 'aprobado' },
          { title: 'Denegado', value: 'denegado' },
        ],
      },
      initialValue: 'pendiente',
    }),
    defineField({
      name: 'notasValidacion',
      title: 'Notas de Validación',
      type: 'text',
    }),
    defineField({
      name: 'activo',
      title: 'Activo',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: 'nombreApellido',
      subtitle: 'peritusId',
      estado: 'estadoDocumentacion',
    },
    prepare({ title, subtitle, estado }) {
      const emoji: Record<string, string> = {
        pendiente: '🟡',
        revision: '🔵',
        aprobado: '🟢',
        denegado: '🔴',
      }
      return {
        title: title || 'Sin nombre',
        subtitle: `${subtitle || ''} ${emoji[estado] || ''}`,
      }
    },
  },
})
