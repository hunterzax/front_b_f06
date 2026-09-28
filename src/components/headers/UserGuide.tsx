import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';

function UserGuide({ downloadUserGuide }: any) {
  return (
    <button
      type="button"
      className=" text-gray-500 rounded-lg hover:opacity-80"
      onClick={() => {
        downloadUserGuide();
      }}
    >
      <LocalLibraryIcon className="text-[#58585A]" />
    </button>
  );
}

export default UserGuide;
