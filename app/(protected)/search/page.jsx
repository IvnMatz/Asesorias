import SearchClient from './SearchClient'

export default async function SearchPage({ searchParams }) {
  const params = await searchParams
  const materiaId = params?.materia || null

  return (
    <main>
      <SearchClient materiaId={materiaId} />
    </main>
  )
}